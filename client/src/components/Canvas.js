import React, { useState, useEffect, useRef } from 'react';
import Fab from "@material-ui/core/Fab";
import SaveAlt from "@material-ui/icons/SaveAlt";
import Undo from "@material-ui/icons/Undo";
import Redo from "@material-ui/icons/Redo";
import AddIcon from "@material-ui/icons/Add";
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: 'center',
        height: "100%",
        width: "100%",
    },
    canvasContainer: {
        overflow:"hidden", 
        position: "relative", 
        width:"70%", 
        height:"70%", 
        display: "flex", 
        alignItems:"center",
        justifyContent: "center",
    },
    canvasContainer_: {
        overflow:"hidden", 
        position: "relative",
        display: "flex", 
    },
    canvas: {
        position: "absolute",
    },
    image: {
        position: "absolute",
    },
    startPoint:{
        zIndex:"10", 
        position:"absolute", 
        border: "solid", 
        borderRadius: "50%",
    },
    buttons: {
        width: "70%",
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-around",
        margin: 10,
    },
});

const fillAlpha = 0.3;

const Canvas = props =>  {
    const classes = useStyles();
    
    const distancethreshold = 10;
    const startPointSize = 20;
    const colors = [
        {name: "green", code: "#0F0"},
        {name: "blue", code: "#00F"},
        {name: "red", code: "#F00"},
        {name: "aqua", code: "#0FF"},
        {name: "purple", code: "#F0F"},
        {name: "yellow", code: "#FF0"},
        {name: "black", code: "#000"},
        {name: "clear", code: "#FFF"},
      ];

    const [color, setColor] = useState("#0F0");
    const [initialCoordinate, setInitialCoordinate] = useState({});
    const [imageSize, setImageSize] = useState({});
    const [imageName, setImageName] = useState();
    const [canvasContainerSize, setCanvasContainerSize] = useState({});
    const [devider, setDevider] = useState();
    const [redoStack, setRedoStack] = useState();
    const [editings, setEditings] = useState();
    const [imageSrc, setImageSrc] = useState();
    const [isDrawing, setIsDrawing] = useState(false);

    const canvasRef = useRef(null);
    const isDrawingRef = useRef(false);
    const canvasContainerRef = useRef(null);
    const coordinatesRef = useRef([]);
    const editingsRef = useRef(editings);
    const colorRef = useRef(color);

    useEffect(() => {
        initialize();
        setColor("#0F0");
        canvasRef.current.addEventListener("touchstart", startDrawing, {passive:false});
        canvasRef.current.addEventListener("touchmove", draw, {passive:false});
        canvasRef.current.addEventListener("touchend", endDrawing, {passive:false});
        const rect = canvasContainerRef.current.getBoundingClientRect();
        setCanvasContainerSize({width: rect.width, height: rect.height});
    }, []);

    const getContext = () => {
        return canvasRef.current.getContext('2d');
    };
    const startDrawing = event => {
        let x = (event.touches[0].pageX-event.target.getBoundingClientRect().left);
        let y = (event.touches[0].pageY-event.target.getBoundingClientRect().top);
        if(x < 0){x = 0}
        else if(x > canvasRef.current.width){x = canvasRef.current.width;}
        if(y < 0){y = 0}
        else if(y > canvasRef.current.width){y = canvasRef.current.width}
        const ctx = getContext();
        if (isDrawingRef.current) {
            const lastCoordinate = coordinatesRef.current[coordinatesRef.current.length-1];
            const lastX = lastCoordinate.x;
            const lastY = lastCoordinate.y;
            const ctx = getContext();
            ctx.moveTo(lastX, lastY);
            ctx.strokeStyle = colorRef.current;
            ctx.globalCompositeOperation = "destination-out";
            ctx.lineTo(x, y);
            ctx.stroke();
            ctx.globalCompositeOperation = 'source-over';
            ctx.lineTo(x, y);
            ctx.stroke();
            coordinatesRef.current = [...coordinatesRef.current, {x:x, y:y}];
        } else {
            console.log(x, y);
            setInitialCoordinate({x: x, y: y});
            updateIsDrawing(true);
            ctx.beginPath();
            ctx.moveTo(x, y);
            coordinatesRef.current = [{x:x, y:y}];
        }
        event.stopPropagation();
        event.preventDefault();
    };
    const draw = event => {
        updateIsDrawing(true);
        let x=(event.touches[0].pageX-event.target.getBoundingClientRect().left);
        let y=(event.touches[0].pageY-event.target.getBoundingClientRect().top);
        if(x < 0){x = 0}
        else if(x > canvasRef.current.width){x = canvasRef.current.width;}
        if(y < 0){y = 0}
        else if(y > canvasRef.current.width){y = canvasRef.current.width;}
        const ctx = getContext();
        ctx.strokeStyle = colorRef.current;
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineTo(x, y);
        ctx.stroke();
        coordinatesRef.current = [...coordinatesRef.current, {x:x, y:y}];
        event.stopPropagation();
        event.preventDefault();
    };
    const endDrawing = event => {
        const lastCoordinate = coordinatesRef.current[coordinatesRef.current.length-1];
        const lastX = lastCoordinate.x;
        const lastY = lastCoordinate.y;
        const startCoordinate = coordinatesRef.current[0];
        const startX = startCoordinate.x;
        const startY = startCoordinate.y;
        const distance = Math.sqrt((lastX - startX)**2 + (lastY - startY)**2);
        if (distance < distancethreshold) {
            updateIsDrawing(false);
            const ctx = getContext();
            ctx.closePath();
            eraseInsideLine(coordinatesRef.current);
            if (colorRef.current !== '#FFF') {
                fillInsideLine(colorRef.current, coordinatesRef.current);
            }
            const newEditings = [...editingsRef.current, {editor: "", color:colorRef.current, coordinates: coordinatesRef.current}];
            updateEditings(newEditings);
            coordinatesRef.current = [];
            setRedoStack([]);
        }
    };
    const eraseInsideLine = coordinates_ => {
        const ctx = getContext();
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.moveTo(coordinates_[0].x, coordinates_[0].y);
        for (let coordinateProperty in coordinates_.slice(1)){
            ctx.lineTo(coordinates_[coordinateProperty].x, coordinates_[coordinateProperty].y);
            ctx.stroke();
        }
        ctx.closePath();
        ctx.fill();
    };
    const fillInsideLine = (color_, coordinates_) => {
        const ctx = getContext();
        ctx.strokeStyle = color_;
        ctx.fillStyle = color_;
        ctx.globalAlpha = fillAlpha;
        ctx.globalCompositeOperation = "source-over";
        ctx.beginPath();
        ctx.moveTo(coordinates_[0].x, coordinates_[0].y);
        for (let coordinate_property in coordinates_.slice(1)){
            ctx.lineTo(coordinates_[coordinate_property].x, coordinates_[coordinate_property].y);
            ctx.stroke();
        }
        ctx.closePath();
        ctx.fill();
    };
    const updateEditings = newEditings => {
        setEditings(newEditings);
        editingsRef.current = newEditings;
    };
    const undo = event => {
        if(editings.length>0){
            eraseInsideLine([{x:0,y:0}, {x:canvasRef.current.width,y:0}, {x:canvasRef.current.width,y:canvasRef.current.height}, {x:0,y:canvasRef.current.height}, {x:0,y:0}])
            const newEditings = editings.slice(0,-1);
            const newRedoStack = [...redoStack, editings.slice(-1)[0]]
            updateEditings(newEditings);
            setRedoStack(newRedoStack);
            fromData(newEditings);
        }
    };
    const redo = event => {
        if(redoStack.length > 0){
            const newEditings = [...editings, redoStack.slice(-1)[0]];
            const newRedoStack = redoStack.slice(0, -1)
            updateEditings(newEditings);
            setRedoStack(newRedoStack);
            fromData(newEditings);
        }
    };
    const fromData = data => {
        for(let index in data){
            const editLog_ = data[index];
            eraseInsideLine(editLog_.coordinates);
            if (editLog_.color !== '#FFF') {
                fillInsideLine(editLog_.color, editLog_.coordinates);
            }
        }
    };
    const clearCanvas = () => {
        const ctx = getContext();
        ctx.clearRect(0,0,canvasRef.current.width,canvasRef.current.height);
    };
    const updateColor = newColor => {
        setColor(newColor);
        colorRef.current = newColor;
    };
    const updateIsDrawing = newState => {
        setIsDrawing(newState);
        isDrawingRef.current = newState;
    };
    const handleInputOnChange = e => {
        var createObjectURL = (window.URL || window.webkitURL).createObjectURL || window.createObjectURL;
        const files = e.target.files;
        const file = files[0];
        setImageName(file.name.split(/\.(?=[^.]+$)/)[0]);
        const imageUrl = createObjectURL(file);
        setImageSrc(imageUrl);
        const image = new Image();
        image.onload = function () {
            const newDivider = image.height/canvasContainerSize.height > image.width/canvasContainerSize.width ? image.height/canvasContainerSize.height: image.width/canvasContainerSize.width;
            setDevider(newDivider);
            setImageSize({width: image.width, height: image.height})
        };
        image.src = imageUrl;
    };
    const handleSaveButtonClick = () => {
        let link = document.createElement("a");
        link.href = canvasRef.current.toDataURL("image/png");
        link.download = `${imageName}.png`;
        link.click();
        initialize();
    };
    const initialize = () => {
        clearCanvas();
        setEditings([]);
        setRedoStack([]);
        coordinatesRef.current = [];
        editingsRef.current = [];
    };
    
    return (
        <div className={classes.root}>
            <div ref={canvasContainerRef} className={classes.canvasContainer}>
                <div 
                    className={classes.canvasContainer_}
                    style={{
                        width:`${imageSize.width/devider}px`,
                        height:`${imageSize.height/devider}px`
                    }}>
                    <img 
                        src={imageSrc} 
                        width={`${imageSize.width/devider}px`}
                        height={`${imageSize.height/devider}px`}
                        className={classes.image} 
                        alt={imageSrc}/>
                    <canvas
                        ref={canvasRef}
                        width={`${imageSize.width/devider}px`}
                        height={`${imageSize.height/devider}px`}
                        className={classes.canvas}
                    >
                    </canvas>
                    <div 
                        className={classes.startPoint} 
                        style={{
                            marginLeft:`${initialCoordinate.x-startPointSize/2}px`, 
                            marginTop:`${initialCoordinate.y-startPointSize/2}px`, 
                            width:`${startPointSize}px`, 
                            height:`${startPointSize}px`, 
                            opacity:`${isDrawing ? 1 : 0}`}}>

                    </div>
                </div>
            </div>
            <div className={classes.buttons}>
                <label htmlFor="upload-image">
                    <input
                        id="upload-image"  
                        name="upload-image"  
                        type="file"
                        style={{display:"none"}} 
                        onChange={handleInputOnChange}/>
                    <Fab variant="extended" color="secondary" component="span"><AddIcon/>Upload</Fab>
                </label>
                {colors.map((color, key) => {
                    return <Fab variant="extended" children={""} key={key} style={{backgroundColor: color.code}} onClick={()=>{updateColor(color.code)}}></Fab>
                })}
                <Fab variant="extended" color="secondary" onClick={undo}><Undo/>Undo</Fab>
                <Fab variant="extended" color="secondary" onClick={redo}><Redo/>Redo</Fab>
                <Fab variant="extended" color="secondary" onClick={handleSaveButtonClick}><SaveAlt/>Save</Fab>
           </div>
        </div>
    );
    
}

export default Canvas;

