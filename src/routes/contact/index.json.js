export const post = async(request) => {
    const formID = "1FAIpQLSco-48vyzr92Wt4u73dIcJwBijGMdKwZuBNi_FLzZf6i0KzSw"
    const name = request.body.get("name")
    const email = request.body.get("email")
    const message = request.body.get("message")

    const res = await fetch(`https://docs.google.com/forms/d/e/${formID}/formResponse?usp=pp_url&entry.1430917826=${name}&entry.636051757=${email}&entry.1669937629=${message}&submit=Submit`);

    if(res.status === 200) {
        return {
            status: 200,
            body: {
                message: "success",
            },
        };
    } else {
        return {
            status: 404,
            body: {
                message: "failed",
            },
        };
    }  
};

