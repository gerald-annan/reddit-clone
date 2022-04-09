import { User } from "../entities/User";
import { MyContext } from "src/types";
import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Resolver } from "type-graphql";
import argon2 from "argon2";
import session from 'express-session';

@InputType()
class UsernamePasswordInput {
    @Field()
    username: string
    @Field()
    password: string
}

@ObjectType()
class FieldError {
    @Field()
    field: string;
    @Field()
    message: string;
}

@ObjectType()
class UserResponse {
    @Field(() => [FieldError], {nullable: true})
    errors?: FieldError[]
    @Field(() => User, {nullable: true})
    user?: User
}

@Resolver()
export class UserResolver {
    @Mutation(() => User)
    async register(
        @Arg('options') options: UsernamePasswordInput,
        @Ctx() { em }: MyContext
    ): Promise<UserResponse> {

        if (options.username.length <= 2) {
            return {
                errors: [
                    {
                        field: "username",
                        message: "username cannot be less than 2"
                    },
                ],
            }
        }

        if (options.password.length <= 3) {
            return {
                errors: [
                    {
                        field: "password",
                        message: "password cannot be less than 3"
                    },
                ],
            }
        }

        const hashedPassword = await argon2.hash(options.password);
        const user = em.create(User, new User(options.username, hashedPassword));
        try{
            await em.persistAndFlush(user);
        } catch (err) {

            if (err.code === "23505") {
                return {
                    errors: [
                        {
                            field: "username",
                            message: "username already taken"
                        },
                    ]
                }
            }
        }

        return { user };
    }

    @Mutation(() => User)
    async login(
        @Arg('options') options: UsernamePasswordInput,
        @Ctx() { em, req }: MyContext
    ): Promise<UserResponse> {
        const user = await em.findOne(User, { username: options.username });
        
        if (!user) {
            return {
                errors: [
                    {
                        field: "username",
                        message: "username does not exit"
                    },
                ],
            }
        }

        const valid = await argon2.verify(user.password, options.password);
        
        if (!valid) {
            return {
                errors: [
                    {
                        field: "password",
                        message: "incorrect password"
                    },
                ],
            }
        }

        req.session.userId = user.id;

        return { user };
    }
}