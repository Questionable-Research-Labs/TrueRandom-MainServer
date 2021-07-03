import {NextFunction, Request, Response, Router} from "express"
import DiceInterface from "../app/interface";

const router: Router = Router();

const diceInterface: DiceInterface = new DiceInterface(3456);

router.get('/random', (req: Request, res: Response, next: NextFunction) => {
    console.log('random')
    diceInterface.queue('hi', function () {

    });
    res.send({
        "response": 1
    });
});

export default router;
