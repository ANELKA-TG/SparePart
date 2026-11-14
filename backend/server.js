require("dotenv").config();
const path = require("path");
const express=require("express");
const cors =require("cors");
const connectDB = require("./config/db");

connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/",(req,res)=>{
    res.json({message:"SparePart API is running"});
});

app.use("/api/products", require("./routes/productRoutes"));

app.use("/api/auth", require("./routes/authRoutes"));

app.use("/api/orders", require("./routes/orderRoutes"));

app.use("/api/uploads", require("./routes/uploadRoutes"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`))