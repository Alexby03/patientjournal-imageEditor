require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { expressjwt: jwt } = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const routes = require('./routes.js');

const app = express();

app.use(cors());
app.use(express.json({ limit: '16mb' }));
app.use(express.urlencoded({ extended: true, limit: '16mb' }));

const KEYCLOAK_URL = process.env.OIDC_AUTH_SERVER_URL || 'http://localhost:8080/realms/PatientJournal';
const AUDIENCE = 'backend-api'; // Matches quarkus.oidc.client-id

const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${KEYCLOAK_URL}/protocol/openid-connect/certs`
    }),
    audience: AUDIENCE,
    issuer: KEYCLOAK_URL,
    algorithms: ['RS256']
});

app.get('/healthz', (req, res) => {
    res.status(200).send('OK');
});

app.use('/images', checkJwt, routes);

app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({ message: 'Invalid token or no token provided' });
    }
    next(err);
});

const PORT = process.env.PORT || 8085;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`ImageService running on port ${PORT}`);
});
