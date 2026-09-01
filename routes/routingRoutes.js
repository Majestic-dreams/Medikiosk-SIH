const express = require("express");

const {
    routePatient
} = require("../services/routingService");

const router = express.Router();


// --------------------------------------
// POST /api/routing/route
// --------------------------------------

router.post("/route", (req, res) => {

    try {

        console.log(
            "\nRouting request received:"
        );

        console.dir(
            req.body,
            { depth: null }
        );


        const result =
            routePatient(req.body);


        console.log(
            "\nRouting result:"
        );

        console.dir(
            result,
            { depth: null }
        );


        return res.status(200).json(result);

    } catch (error) {

        console.error(
            "\nRouting API Error:"
        );

        console.error(error);


        return res.status(500).json({

            success: false,

            error:
                "Internal routing error.",

            message:
                error.message

        });
    }
});


module.exports = router;