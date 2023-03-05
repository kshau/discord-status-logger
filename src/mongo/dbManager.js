const {default: mongoose} = require("mongoose");
const {UserStatusSchema} = require("./schemas");

const MONGODB_CONNECTION = process.env.MONGODB_CONNECTION;

mongoose.connect(MONGODB_CONNECTION, {dbName: "DiscordStatusLogger", useNewUrlParser: true, useUnifiedTopology: true});

async function hasUser(userId) {

    return (await UserStatusSchema.where("userId").equals(userId)
        .then(json => {
            if (json.length > 0) {
                return true;
            } 
            return false;
        }))

}

function createUser(userId) {

    var schema = new UserStatusSchema({
        userId: userId,
        statusType: "", 
        status: ""
    })

    schema.save();

}

function setUserAttributes(userId, attrs) {

    UserStatusSchema.where("userId").equals(userId)

        .then(json => {

            var newJSON = json[0];

            attrs.forEach(a => {
                newJSON[a.key] = a.value;
            })

            UserStatusSchema.deleteOne({userId: userId});
            UserStatusSchema.create(newJSON);

        })

}

async function getUser(userId) {
    return (await UserStatusSchema.where("userId").equals(userId)
        .then(json => {
            return json[0];
        }))
}

module.exports = {createUser, setUserAttributes, getUser, hasUser}