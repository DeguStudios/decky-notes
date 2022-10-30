import React, { TouchEvent, MouseEvent, CSSProperties, useRef, useState, useEffect } from 'react';

interface Position {
  x: number,
  y: number
}

interface WhiteboardHandler {
  pickImage: () => Promise<string>,
  saveWhiteboard: (encodedImage:string) => Promise<void>,
}

function Whiteboard({pickImage, saveWhiteboard} : WhiteboardHandler) {
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
    marginTop: steamBorderMargin
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
        image.src = imageUrl;//'data:image/jpeg;base64,'+ encodedImage
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

  const saveDrawing = () => {
    let tempCanvas = document.createElement('canvas');
    tempCanvas.width = getBackgroundContext().canvas.width;
    tempCanvas.height = getBackgroundContext().canvas.height;
    let tempContext = tempCanvas.getContext('2d');
    tempContext!.drawImage(getBackgroundContext().canvas, 0, 0);
    tempContext!.drawImage(getDrawingContext().canvas, 0, 0);
    var dataUrl = tempCanvas.toDataURL('image/png');
    saveWhiteboard(dataUrl);
  }

  const DrawingButton = (props: {color: string}) => {
    return (
      <button onClick={() => setToDraw(props.color)} 
              style={{color: props.color}} 
              disabled={!isErasing && drawColor === props.color}>
        Draw
      </button>
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
        <button onClick={setToErase} disabled={isErasing}>Erase</button>
        <button onClick={clearDrawing}>Clear</button>
        <button onClick={saveDrawing}>Save Drawing</button>
      </div>
    </div>
  );
}

export default Whiteboard;
