require('dotenv').config();

import express, {Express, NextFunction, Request, Response} from "express"
import rateLimit from "express-rate-limit"
import * as path from "path";
import morgan from "morgan";
import sassMiddleware from "node-sass-middleware"
import indexRouter from "../routes/index";
import apiRouter from "../routes/api";
import createError, {HttpError} from "http-errors";

const ROOT_PATH = path.join(__dirname, '../')
const RATE_BYPASS_KEY: string = process.env.RATE_BYPASS_KEY ?? 'RateBypass'

export const web: Express = express();
const logger = morgan('dev');
const viewsDir: string = path.join(ROOT_PATH, 'views');

web.set('views', viewsDir);
web.set('view engine', 'hbs');

web.use(sassMiddleware({
    src: path.join(ROOT_PATH, 'public'),
    dest: path.join(ROOT_PATH, 'public'),
    indentedSyntax: true,
    sourceMap: true,
    debug: true,
    includePaths: [path.join(ROOT_PATH, 'node_modules')],
    outputStyle: 'compressed'
}));

web.use(express.static(path.join(ROOT_PATH, 'public')));
web.use(logger);
web.use('/', indexRouter);
web.use('/api', rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: function (req: Request) {
        // TODO: Plan based rate limiting
        return 10;
    },
    skip: (req: Request) => req.headers.authorization === RATE_BYPASS_KEY
}));
web.use('/api', apiRouter);


web.use((req: Request, res: Response, next: NextFunction) => next(createError(404)));

web.use((err: HttpError, req: Request, res: Response, next: NextFunction) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error');
});



