import {NextFunction, Request, Response, Router} from "express"
import {diceInterface} from "../app/app"
import {v4 as uuidv4} from "uuid";

const router: Router = Router();

router.get('/random', (req: Request, res: Response, next: NextFunction) => {
    diceInterface.queue(uuidv4(), function (value: number | string) {
        let out: number
        if (typeof value === 'string') {
            out = parseInt(value)
        } else {
            out = value;
        }
        res.send({
            "response": out
        });
    })
});

router.get('/twitch/random', (req: Request, res: Response, next: NextFunction) => {
    diceInterface.queue(uuidv4(), function (value: number | string) {
        let out: number
        if (typeof value === 'string') {
            out = parseInt(value)
        } else {
            out = value;
        }
        res.send({
            "response": out
        });
    }, true);
});

export default router;
