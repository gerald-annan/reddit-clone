import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import mikroOrmConfig from "./mikro-orm.config";
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/posts";
import { UserResolver } from "./resolvers/user";
import redis from 'redis';
import session from 'express-session';
import connectRedis from 'connect-redis';
import { MyContext } from "src/types";
import { create } from "domain";

const main = async () => {
    const orm = await MikroORM.init(mikroOrmConfig);

    await orm.getMigrator().up();

    const app = express();

    const session = require("express-session");
    let redisStore = require("connect-redis")(session);
    const { createClient } = require("redis");
    let redisClient = createClient({ legacyMode: true });
    
    redisClient.connect().catch(console.error);

    app.use(
        session({
            name: 'qid',
            store: new redisStore({
                client: redisClient,
                disableTouch: true
            }),
            cookie: {
                maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
                httpOnly: true,
                sameSite: "lax",
                secure: __prod__
            },
            saveUninitialized: false,
            secret: 'xnianqh8h4fhpvnadhacpmh',
            resave: false,
        }) 
    )

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver, UserResolver],
            validate: false
        }),
        context: ({req, res}): MyContext => ({ em: orm.em, req, res })
    })

    apolloServer.start().then(_ => {
        apolloServer.applyMiddleware({ app });

        app.listen({ port: 4000 }, () =>
            console.log('server started on http://localhost:4000')
        )
    })
}

main().catch((err) => console.error(err));