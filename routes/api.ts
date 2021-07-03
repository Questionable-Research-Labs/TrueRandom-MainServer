import {NextFunction, Request, Response, Router} from "express"
import {diceInterface} from "../app/app"
import { v4 as uuidv4 } from "uuid";

const router: Router = Router();

router.get('/random', (req: Request, res: Response, next: NextFunction) => {
    diceInterface.queue(uuidv4(), function (value: number|string) {
        res.send({
            "response": value
        });
    })
});

export default router;
