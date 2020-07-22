const express = require('express')
const router = new express.Router()
const auth = require('../middleware/auth')
const Task = require('../db/models/task')

//========
//Task Creation
router.post('/tasks', auth, async (req,res)=>{
    
    //const task = new Task(req.body)
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })

    try {
        await task.save()
        res.status(201).send(task)
    } catch (e) {
        res.status(400).send(e)
    }
    // task.save().then(()=>{
    //     res.status(201).send(task)
    // }).catch((e)=>{
    //     res.status(400).send(e)
    // })
})
//=========

//GET /tasks?completed=true
//pagination settings GET /tasks?limit=10&skip=0
// GET /tasks?sortBy=CreatedAt:asc
router.get('/tasks', auth, async (req,res)=>{
    const match = {}

    if (req.query.completed) {
        match.completed = (req.query.completed === 'true')
    }

    const sort = {}

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    try {
        //const tasks = await Task.find({})
        //const tasks = await Task.find({owner: req.user._id})
        await req.user.populate({
            path:'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort//: {
                //    completed: -1 // 1 asc or -1 desc
                //}
            }
        }).execPopulate()
        res.send(req.user.tasks)
    } catch (e) {
        res.status(500).send()
    }
    // Task.find({}).then((tasks)=>{
    //     res.send(tasks)
    // }).catch((e)=>{
    //     res.status(500).send()
    // })
})

router.get('/tasks/:id', auth, async (req,res)=>{
    //console.log(req.params)
    const _id = req.params.id

    try {
        //const task = await Task.findById(_id)
        const task = await Task.findOne({_id,owner: req.user._id})

        if (!task) {
            return res.status(404).send()
        }
        res.status(200).send(task)
    } catch (e) {
        res.status(500).send(e)
    }

    // Task.findById(_id).then((task)=>{
    //     if (!task) {
    //         return res.status(404).send()
    //     }
    //     res.status(200).send(task)
    // }).catch((e)=>{
    //     console.log(e)
    //     res.status(500).send(e)
    // })
    
})

router.patch('/tasks/:id', auth, async (req,res)=>{
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description','completed']
    const isValidOperation = updates.every((update)=>{
        return allowedUpdates.includes(update)
    })

    if (!isValidOperation) {
        return res.status(400).send({error:'invalid operation'})
    }

    try {
        //const task = await Task.findById(req.params.id)
        const task = await Task.findOne({_id: req.params.id, owner: req.user._id})
        
        //const task = await Task.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true})

        if (!task) {
            return res.status(404).send()
        }

        updates.forEach((update)=> {task[update] = req.body[update]
        })
        await task.save()

        res.send(task)
    } catch (e) {
        res.status(400).send(e)
    }
})



router.delete('/tasks/:id', auth, async (req,res)=>{
    try {
        //const task = await Task.findByIdAndDelete(req.params.id)
        const task = await Task.findOneAndDelete({_id: req.params.id, owner: req.user._id})
        if (!task) {
            return res.status(404).send()
        }
        res.send(task)
    } catch (e) {
        res.status(500).send()
    }
})


module.exports = router