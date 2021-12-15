import { connectToDatabase } from '$lib/db';

export const get = async(context) => {
    const dbConnection = await connectToDatabase();
    const db = dbConnection.db;
    console.log("context: ", context);

    if (!context.locals.user.authenticated) {
        return {
            status: 401,
            body: {
                message: 'Unauthorized'
            }
        };
    }

    const user = await db.collection('testUsers').findOne({ email: context.locals.user.email });

    if (!user) {
        return {
            status: 404,
            body: {
                message: 'User not found'
            }
        };
    }

    delete user.password;

    return {
        status: 200,
        body: user
    };
};