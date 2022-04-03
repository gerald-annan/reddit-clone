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

const redis = require('redis');
const session = require('express-session');

const main = async () => {
    const orm = await MikroORM.init(mikroOrmConfig);

    await orm.getMigrator().up();

    const app = express();

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloResolver, PostResolver, UserResolver],
            validate: false
        }),
        context: () => ({ em: orm.em })
    })

    apolloServer.start().then(_ => {
        apolloServer.applyMiddleware({ app });

        app.listen({ port: 4000 }, () =>
            console.log('server started on http://localhost:4000')
        )
    })
}

main().catch((err) => console.error(err));