const express = require('express');
const multer = require('multer');
const controller = require('./imageController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const allowRoles = (allowedRoles) => {
    return (req, res, next) => {
        // DEBUGGING LOGS
        console.log("------------------------------------------------");
        console.log("Checking permissions for User:", req.auth.sub);
        console.log("Required Roles:", allowedRoles);
        console.log("Token payload (req.auth):", JSON.stringify(req.auth, null, 2));

        // Try to find roles in different common locations
        const realmRoles = req.auth?.realm_access?.roles || [];
        const clientRoles = req.auth?.resource_access?.['patient-journal-frontend']?.roles || []; // Check your client ID here

        const allRoles = [...realmRoles, ...clientRoles];
        console.log("Found Roles:", allRoles);
        console.log("------------------------------------------------");

        const hasPermission = allRoles.some(role => allowedRoles.includes(role));

        if (hasPermission) {
            next();
        } else {
            res.status(403).json({
                message: 'Forbidden: Insufficient privileges',
                debug_roles_found: allRoles // Helpful for frontend debugging (remove in prod)
            });
        }
    };
};

router.post('/upload',
    allowRoles(['Doctor']),
    upload.single('image'),
    controller.uploadImage
);

router.get('/:id',
    allowRoles(['Doctor']),
    controller.getImage
);

router.put('/:id',
    allowRoles(['Doctor']),
    upload.single('image'),
    controller.updateImage
);

router.get('/practitioner/:id',
    allowRoles(['Doctor']),
    controller.getImagesForDoctor
);

router.delete('/:id',
    allowRoles(['Doctor']),
    controller.deleteImage
);

module.exports = router;
