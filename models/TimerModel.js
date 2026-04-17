import mongoose from "mongoose";

const timerSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId, ref:'User', required:true
    },
    startTime:{
        type:Date, required:true
    },
    endTime:{
        type:Date, required:true
    },
    duration:{
        type:Number, required:true // duration in seconds
    },
    date:{
        type:Date, required:true
    }
});

export default mongoose.model('Timer',timerSchema) 