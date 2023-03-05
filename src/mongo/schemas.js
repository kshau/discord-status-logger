const {Schema, model} = require("mongoose");

const UserStatusSchema = model("userstatus", new Schema({
    userId: {
        type: String, 
        required: true
    },
    statusType: {
        type: String, 
        required: false
    },
    status: {
        type: String, 
        required: false
    }, 
}))

module.exports = {UserStatusSchema};