import express from "express";
import globalErrorHandler from "./middleware/ErrorHandler.js";
import cors from "cors";
import helmet from "helmet";
import Route from "./Routes/user.js";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import AdminRoute from "./Routes/adminRoute.js";
import { NEW_ORDER_WEB_HOOK } from "./Orders/Hooks/orderHook.js";
import { config } from "./config/_config.js";
import ManagerRoute from "./Routes/managerRoute.js"
import EMPRoutes from "./Routes/employeeRoute.js";
import DeliveryAgentRoute from "./Routes/DeliveryPartnersRoutes.js";
import { SuperVisorRoutes } from "./Routes/superVisorRoutes.js";


const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.disable('x-powered-by');
app.set('trust proxy', true);

const allowedOrigins = [
    config.FRONTEND_URL,
    config.ADMIN_DASHBOARD_URL,
    'http://localhost:5173',
    config.ORGIN1,
    config.ORGIN2,
    config.ORGIN3,
];

console.log(allowedOrigins);

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'OPTIONS', 'DELETE'],
        allowedHeaders: ['Authorization', 'Content-Type', 'Accept-Language', 'Cookie'],
    })
);

// Middleware to set unique visitor ID in cookie
const ipLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 500,
    message: 'Too many requests. Please try again later.',
    standardHeaders: true,
    legacyHeaders: false,

    keyGenerator: (req) => {
        let clientIP = '';

        if (req.headers['x-forwarded-for']) {
            clientIP = req.headers['x-forwarded-for'].split(',')[0].trim();
        } else {
            clientIP = req.ip;
        }
        const ip = clientIP;
        return ip;
    }
});


app.use(ipLimiter);
app.use('/api', Route);
app.use('/api/admin', AdminRoute);

// app.use('/api/employee/', EMPRoutes);
// app.use('/api/v1/manager', ManagerRoute);
// app.use('/api/v1/agent', DeliveryAgentRoute);
// app.use('/api/v1/supervisor', SuperViclearsorRoutes)

// razorPay-webhook event(paid, failed)
app.post('/api/v1/rzrpay-payment-capture', NEW_ORDER_WEB_HOOK);

app.get('/health', (req, res, next) => {
    res.json(
        {
            success: true
        }
    );
});

// for-undeclared-routes
app.use(function (req, res, next) {
    return res.status(400).json({
        ip: req.ip,
        success: false,
        status: 404,
        msg: "please try again later.."
    })
});

// Error handler middleware
app.use(globalErrorHandler);
export default app