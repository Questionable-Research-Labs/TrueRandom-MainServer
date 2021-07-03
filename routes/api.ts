import {NextFunction, Request, Response, Router} from "express"
const router: Router = Router();

router.get('/random', (req: Request, res: Response, next: NextFunction) => {
    console.log('random')
    res.send({
        "response": 1
    });
});

export default router;
