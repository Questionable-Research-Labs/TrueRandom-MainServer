import { Request, Response, Router } from "express"
import { v4 } from "uuid";
import DiceController from "../controller";

export default (controller: DiceController) => {

    const router: Router = Router(); // Create a new router

    router.get('/random', (req: Request, res: Response) => {
        controller.request(v4(), (value: number) => res.send({ response: value }))
    });

    router.get('/twitch/random', (req: Request, res: Response) => {
        controller.request(v4(), (value: number) => res.send({ response: value }), false);
    });

    return router;
}

