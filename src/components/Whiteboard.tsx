import React, { TouchEvent, MouseEvent, CSSProperties, useRef, useState, useEffect } from 'react';
import { IconType } from 'react-icons';
import { FaPaintBrush, FaEraser, FaTrashAlt, FaSave } from "react-icons/fa";

interface Position {
  x: number,
  y: number
}

export interface WhiteboardState {
  imageDataUrl: string,
  thumbnailDataUrl: string,
  iconDataUrl: string
}

interface WhiteboardHandler {
  pickImage: () => Promise<string>,
  saveWhiteboard: (encodedImage:WhiteboardState) => Promise<void>,
}

export function Whiteboard({pickImage, saveWhiteboard} : WhiteboardHandler) {
  const steamBorderMargin = 40;
  const backgroundLayerStyle: CSSProperties = {
    zIndex: 1,
    position: "absolute",
    marginTop: steamBorderMargin
  };
  const drawingLayerStyle: CSSProperties = {
    zIndex: 2,
    position: "absolute",
    marginTop: steamBorderMargin
  };
  const uiLayerStyle: CSSProperties = {
    zIndex: 3,
    position: "absolute",
    marginTop: steamBorderMargin,
    display: 'flex',
    justifyContent: 'center',
    width: '100%'
  }

  const black = '#000000';
  const red = '#FF0000';
  const green = '#00FF00';
  const blue = '#0000FF';
  const yellow = '#FFFF00';

  const [isErasing, setIsErasing] = useState(false);
  const [drawColor, setDrawColor] = useState(black);

  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  var lastPosition: Position | null = null;
  var mouseIsDown = false;

  const drawCircle = (pos:Position) => {
    var context = getDrawingContext();
    context.fillStyle = drawColor;
    context.beginPath();  
    context.globalCompositeOperation = isErasing ? "destination-out" : "source-over";
    context.arc(pos.x, pos.y, 10, 0, Math.PI*2);
    context.closePath();
    context.fill();  
  }

  const drawLine = (from:Position, to:Position) => {
    var context = getDrawingContext();
    context.fillStyle = drawColor;
    context.strokeStyle = drawColor;
    context.lineWidth = 20;
    context.beginPath();  
    context.globalCompositeOperation = isErasing ? "destination-out" : "source-over";
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);    
    context.stroke();  
  }

  const onTouch = (e: TouchEvent<HTMLCanvasElement>) => {
    let pos = {x:e.changedTouches[0].clientX, y:e.changedTouches[0].clientY-steamBorderMargin};
    switch (e.type) {      
      case 'touchstart': {
        startDrawing(pos);     
        break;
      }
      case 'touchmove':{       
        keepDrawing(pos);                  
        break;
      }
      case 'touchcancel':
      case 'touchend':{                
        stopDrawing(pos);           
        break;
      }
    }
  }

  const onMouse = (e: MouseEvent<HTMLCanvasElement>) => {
    let pos = {x:e.clientX, y:e.clientY-steamBorderMargin};
    switch (e.type) {      
      case 'mousedown': {
        mouseIsDown = true;
        startDrawing(pos);      
        break;
      }
      case 'mousemove':{       
        if (!mouseIsDown) return;
        keepDrawing(pos);                   
        break;
      }
      case 'mouseup':
      case 'mouseleave': {       
        if (!mouseIsDown) return; 
        mouseIsDown = false;        
        stopDrawing(pos);
        break;
      }
    }
  }    

  const startDrawing = (newPosition: Position) => {
    drawCircle(newPosition);
    lastPosition = newPosition; 
  }

  const keepDrawing = (newPosition: Position) => {
    drawLine(lastPosition!, newPosition);    
    drawCircle(newPosition);    
    lastPosition = newPosition;  
  }

  const stopDrawing = (newPosition: Position) => {
    drawLine(lastPosition!, newPosition);     
    drawCircle(newPosition);        
    lastPosition = null;
  }

  const setToDraw = (color: string) => {
    setIsErasing(false);
    setDrawColor(color);
  }

  const setToErase = () => {
    setIsErasing(true);
  }

  const loadImage = () => {
    pickImage().then((imageUrl) => {
        var context = getBackgroundContext();
        let image = new Image();
        image.crossOrigin="anonymous";
        image.src = imageUrl;
        image.onload = () => {
          context.drawImage(image, 0, 0, context.canvas.width, context.canvas.height);
        }
    });
  }

  const getDrawingContext = ():CanvasRenderingContext2D => {
    return getContext(drawingCanvasRef);
  }

  const getBackgroundContext = ():CanvasRenderingContext2D => {
    return getContext(backgroundCanvasRef);
  }  

  const getContext = (refObj:React.RefObject<HTMLCanvasElement>):CanvasRenderingContext2D => {
    const canvas = refObj.current;
    if (canvas == null)
      throw new Error('Could not get canvas');
    var context = canvas.getContext('2d');
    if (context == null)
      throw new Error('Could not get context');
    return context;
  }

  const clearDrawing = () => {
    var context = getDrawingContext();
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  }

  const saveFullSizeCanvas = (backgroundCanvas:HTMLCanvasElement, drawingCanvas:HTMLCanvasElement) => {
    let tempCanvas = document.createElement('canvas');
    tempCanvas.width = backgroundCanvas.width;
    tempCanvas.height = backgroundCanvas.height;
    let tempContext = tempCanvas.getContext('2d');
    tempContext!.drawImage(backgroundCanvas, 0, 0, tempCanvas.width, tempCanvas.height);
    tempContext!.drawImage(drawingCanvas, 0, 0, tempCanvas.width, tempCanvas.height);
    return tempCanvas.toDataURL('image/png');
  }

  const saveThumbnailCanvas = (backgroundCanvas:HTMLCanvasElement, drawingCanvas:HTMLCanvasElement) => {
    let tempCanvas = document.createElement('canvas');
    tempCanvas.width = 200;
    tempCanvas.height = tempCanvas.width * (backgroundCanvas.height / backgroundCanvas.width);
    let tempContext = tempCanvas.getContext('2d');
    tempContext!.drawImage(backgroundCanvas, 0, 0, tempCanvas.width, tempCanvas.height);
    tempContext!.drawImage(drawingCanvas, 0, 0, tempCanvas.width, tempCanvas.height);
    return tempCanvas.toDataURL('image/png');
  }

  const saveIconCanvas = (backgroundCanvas:HTMLCanvasElement, drawingCanvas:HTMLCanvasElement) => {
    let tempCanvas = document.createElement('canvas');
    tempCanvas.width = 40;
    tempCanvas.height = 40;
    const iconWidth = tempCanvas.width;
    const iconHeight = tempCanvas.width * (backgroundCanvas.height / backgroundCanvas.width);
    var heightOffset = (tempCanvas.width - iconHeight)/2;
    let tempContext = tempCanvas.getContext('2d');
    tempContext!.drawImage(backgroundCanvas, 0, heightOffset, iconWidth, iconHeight);
    tempContext!.drawImage(drawingCanvas, 0, heightOffset, iconWidth, iconHeight);
    return tempCanvas.toDataURL('image/png');
  }

  const saveDrawing = () => {
    var fullCanvasDataUrl = saveFullSizeCanvas(getBackgroundContext().canvas, getDrawingContext().canvas);
    var thumbnailCanvasDataUrl = saveThumbnailCanvas(getBackgroundContext().canvas, getDrawingContext().canvas);
    var iconCanvasDataUrl = saveIconCanvas(getBackgroundContext().canvas, getDrawingContext().canvas);
    saveWhiteboard({
      imageDataUrl: fullCanvasDataUrl,
      thumbnailDataUrl: thumbnailCanvasDataUrl,
      iconDataUrl: iconCanvasDataUrl
    });
  }

  const TopMenuButton = (props: {onClick: () => void, Icon: IconType, title: string, disabled?: boolean, style?: React.CSSProperties}) => {
    return (
      <button onClick={() => props.onClick()} 
              style={{width: '64px', height: '64px', borderRadius: '16px', 
                      backgroundColor: props.disabled ? 'gray' : 'white', borderColor: props.disabled ? 'gray' : 'white',
                      outline: 'none',
                      ...props.style}} 
              disabled={props.disabled}>
                <div>
                  <props.Icon style={{fontSize: '24px'}} />
                  <span style={{fontWeight: 'bold', fontSize: '12px', lineHeight: '22px', letterSpacing: '.5px', textTransform: 'uppercase'}}>{props.title}</span>
                </div>
      </button>
    );
  }

  const DrawingButton = (props: {color: string}) => {
    return (
      <TopMenuButton onClick={() => setToDraw(props.color)} 
                     style={{color: props.color}} 
                     disabled={!isErasing && drawColor === props.color}
                     Icon={FaPaintBrush}
                     title={"Draw"}></TopMenuButton>
    );
  }

  useEffect(() => {
    loadImage();
  }, [])

  return (
    <div>
      <div>
        <canvas ref={drawingCanvasRef} 
                width={window.innerWidth} height={window.innerHeight - steamBorderMargin*2}
                onTouchStart={onTouch}
                onTouchMove={onTouch}
                onTouchEnd={onTouch} onTouchCancel={onTouch}
                onMouseDown={onMouse}
                onMouseMove={onMouse}
                onMouseUp={onMouse} onMouseLeave={onMouse}
                style={drawingLayerStyle}>    
        </canvas>
        <canvas ref={backgroundCanvasRef} 
                width={window.innerWidth} height={window.innerHeight - steamBorderMargin*2}
                style={backgroundLayerStyle}>
        </canvas>
      </div>
      <div style={uiLayerStyle}>
        <DrawingButton color={black}></DrawingButton>
        <DrawingButton color={red}></DrawingButton>
        <DrawingButton color={green}></DrawingButton>
        <DrawingButton color={blue}></DrawingButton>
        <DrawingButton color={yellow}></DrawingButton>
        <TopMenuButton onClick={setToErase} disabled={isErasing} title="Erase" Icon={FaEraser}></TopMenuButton>
        <TopMenuButton onClick={clearDrawing} title="Clear" Icon={FaTrashAlt}></TopMenuButton>
        <TopMenuButton onClick={saveDrawing} title="Save" Icon={FaSave}></TopMenuButton>
      </div>
    </div>
  );
}