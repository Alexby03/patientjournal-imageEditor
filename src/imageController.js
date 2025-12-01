const db = require('./db.js');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');

function uuidToBin(uuid) {
    return Buffer.from(uuid.replace(/-/g, ''), 'hex');
}

exports.uploadImage = async (req, res) => {
    try {
        const imageId = uuidv4();

        const {
            filename,
            mime_type,
            width,
            height,
            patient_id,
            patient_name,
            practitioner_id
        } = req.body;

        const originalBuffer = req.file.buffer;

        const thumbBuffer = await sharp(originalBuffer)
            .resize(200)
            .jpeg({ quality: 70 })
            .toBuffer();

        const creationDate = new Date();

        const sql = `
            INSERT INTO images 
            (image_id, filename, mime_type, image_data, width, height, thumb_data, patient_id, patient_name, practitioner_id, creation_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await db.execute(sql, [
            uuidToBin(imageId),
            filename,
            mime_type,
            originalBuffer,
            width || null,
            height || null,
            thumbBuffer,
            uuidToBin(patient_id),
            patient_name,
            uuidToBin(practitioner_id),
            creationDate
        ]);

        res.json({
            success: true,
            imageId: imageId
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
};


exports.getImage = async (req, res) => {
    try {
        const [rows] = await db.execute(`
            SELECT
                image_data,
                filename,
                mime_type,
                width,
                height,
                creation_date,
                patient_name
            FROM images
            WHERE image_id = ?
        `, [uuidToBin(req.params.id)]);

        if (!rows.length) return res.status(404).send("Not found");

        const img = rows[0];

        res.setHeader("X-Filename", img.filename);
        res.setHeader("X-File-Type", img.mime_type);
        res.setHeader("X-Patient-Name", img.patient_name);
        res.setHeader("X-Width", img.width);
        res.setHeader("X-Height", img.height);
        res.setHeader("X-File-Size", img.image_data.length);
        res.setHeader("X-Creation-Date", img.creation_date.toISOString());

        res.setHeader("Content-Type", img.mime_type);
        res.send(img.image_data);

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};

exports.updateImage = async (req, res) => {
    try {
        const imageId = req.params.id;

        const {
            filename,
            mime_type,
            width,
            height
        } = req.body;

        const originalBuffer = req.file.buffer;

        const thumbBuffer = await sharp(originalBuffer)
            .resize(200)
            .jpeg({ quality: 70 })
            .toBuffer();

        const sql = `
            UPDATE images
            SET filename = ?, mime_type = ?, image_data = ?, width = ?, height = ?, thumb_data = ?
            WHERE image_id = ?
        `;

        await db.execute(sql, [
            filename,
            mime_type,
            originalBuffer,
            width || null,
            height || null,
            thumbBuffer,
            uuidToBin(imageId)
        ]);

        res.json({
            success: true,
            updated: imageId
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getImagesForDoctor = async (req, res) => {
    try {
        const doctorId = req.params.id;

        const userCheckSql = `
            SELECT user_id, user_type
            FROM users
            WHERE user_id = ? AND user_type = 'Doctor'
        `;

        const [userRows] = await db.execute(userCheckSql, [uuidToBin(doctorId)]);

        if (userRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Doctor not found"
            });
        }

        const sql = `
            SELECT 
                BIN_TO_UUID(image_id) AS image_id,
                filename,
                mime_type,
                width,
                height,
                patient_name,
                creation_date,
                thumb_data
            FROM images
            WHERE practitioner_id = ?
            ORDER BY creation_date DESC
        `;

        const [rows] = await db.execute(sql, [uuidToBin(doctorId)]);

        res.json({
            success: true,
            count: rows.length,
            images: rows
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};