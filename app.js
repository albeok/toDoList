const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.set('view engine', "ejs");

mongoose.set('strictQuery', true);
mongoose.connect("mongodb+srv://admin-alberto:Test123@cluster0.6sfpvy3.mongodb.net/todolistDB?retryWrites=true&w=majority");

const itemsSchema = {
    name: {
        type: String,
        require: [true, "A name is necessary"]
    }
};
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "welcome to your todolist!"
});
const item2 = new Item({
    name: "Hit the + button to add a new item."
});
const item3 = new Item({
    name: "<-- Hit this to delete an item."
});
const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res){
    Item.find({}, function(err, items){
        if(items.length === 0){
            Item.insertMany(defaultItems, function(err){
                if(err){
                    console.log(err);
                } else {
                    console.log("Successfully saved default items to DB.");
                }
            });
            res.redirect("/");
        } else {
            res.render('list', {listTitle: "Today", listItems: items});
        }
        
    });
    
});

app.get("/:customListName", function(req, res){
    // res.render("list", {listTitle: paramName, listItems: paramItems});
    const customListName = _.capitalize(req.params.customListName);
    List.findOne({name: customListName}, function(err, result){
        if(!err){
            if(result) {
                res.render("list", {listTitle: result.name, listItems: result.items});
            } else {
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customListName);
            }
        }
        
    });
    
});

app.post("/", function(req, res){
    const itemName = req.body.newItem;
    const listName = req.body.list;


    const newItem = new Item({
        name: itemName
    });

    if(listName === "Today"){
        newItem.save();
        res.redirect("/"); 
    } else {
        List.findOne({name: listName}, function(err, result){
            result.items.push(newItem);
            result.save();
            res.redirect("/" + listName);
        });
    }

    
});

app.post("/delete", function(req, res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today"){
        Item.deleteOne({_id: checkedItemId}, function(err){
            if(err){
                console.log(err);
            } else {
                console.log("successfully deleted");
                res.redirect("/");
            }
        });
    } else {
        List.findOne({name:listName}, function(err, foundList){
            foundList.items.pull({ _id: checkedItemId }); 
            foundList.save(function(){
 
                res.redirect("/" + listName);
            });
        });
    };
});

app.listen(3000, function(){
    console.log("Server started on port 3000");
})