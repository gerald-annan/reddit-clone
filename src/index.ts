import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import mikroOrmConfig from "./mikro-orm.config";

const main = async () => {
    const orm = await MikroORM.init(mikroOrmConfig);
    await orm.getMigrator().up();
    const post = orm.em.create(Post, {
        title: 'my first post',
        createdAt: new Date(),
        updatedAt: new Date()
    });
    
    await orm.em.persistAndFlush(post);
}

main().catch((err) => console.log(err));