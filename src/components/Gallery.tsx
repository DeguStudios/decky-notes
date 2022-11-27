import { PanelSection, PanelSectionRow } from 'decky-frontend-lib';
import { useState, useEffect, CSSProperties } from 'react';

interface GalleryHandler {
  getAllImages: () => Promise<string[]>
  getImage: (fileName:string) => Promise<string>,
  getThumbnailImage: (fileName:string) => Promise<string>,
  deleteImage: (encodedImage:string) => Promise<void>,
}

interface GalleryElementHandler {
  onOpen: () => Promise<void>
  onDelete: () => Promise<void>,
  loadThumbnail: () => Promise<string>,
  title: string
}

interface SelectedImage {
  fileName: string,
  encodedImageData: string
}

function GalleryElement ({loadThumbnail, onOpen, onDelete, title}:GalleryElementHandler): JSX.Element {
  const [source, setSource] = useState<string>('');
  useEffect(() => {
    loadThumbnail().then((encodedImageData:string) => {
      setSource("data:image/jpeg;base64," + encodedImageData);
    });    
  }, [])
  return (
    <div>
      <img crossOrigin={"anonymous"} src={source}/>
      <p>{title}</p>
      <button onClick={() => onOpen()}>Open</button>
      <button onClick={() => onDelete()}>Delete</button>
    </div>
  );
}

function Gallery({getAllImages, getImage, deleteImage, getThumbnailImage}: GalleryHandler) {
  const steamBorderMargin = 40;
  const marginStyle: CSSProperties = {
    marginTop:steamBorderMargin, 
    marginBottom:steamBorderMargin
  };
  const uiLayerStyle: CSSProperties = {
    zIndex: 3,
    position: "absolute"
  }
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<SelectedImage|null>(null);

  useEffect(() => {
    getAllImages().then((allImages) => {
      setImages(allImages);
      setIsLoading(false);
    });    
  }, [])

  const loadThumbnail = async (fileName: string) => {
    return await getThumbnailImage(fileName);
  }

  const onOpen = async (fileName: string) => {
    setIsLoading(true);
    let encodedImageData = await getImage(fileName);
    setSelectedImage({fileName, encodedImageData});
    setIsLoading(false);
  }

  const onDelete = async (fileName: string) => {
    setIsLoading(true);
    setImages(images.filter(image => image != fileName));
    await deleteImage(fileName);
    setIsLoading(false);
  }

  const onClose = () => {
    setSelectedImage(null);
  }

  if (isLoading) {
    return (<p style={marginStyle}>Loading...</p>)
  }

  if (images.length === 0) {
    return (<p style={marginStyle}>No images yet...</p>)
  }

  const buildGalleryView = ():JSX.Element => {
    return  <div style={marginStyle}>
              <PanelSection>
              {images.map((fileName) => (
                <PanelSectionRow>
                  <GalleryElement title={fileName}
                                onDelete={() => onDelete(fileName)}
                                loadThumbnail={() => loadThumbnail(fileName)}
                                onOpen={() => onOpen(fileName)}></GalleryElement>  
                </PanelSectionRow>
              ))}
              </PanelSection>
            </div>;
  }

  const buildSingleImageView = (fileName:string, encodedImage:string):JSX.Element => {
    return  <div style={marginStyle}>
              <div style={uiLayerStyle}>
                <button onClick={onClose}>Close</button>
                <button onClick={() => {onDelete(fileName); onClose()}}>Delete</button>
              </div>
              <img crossOrigin={"anonymous"} src={"data:image/jpeg;base64," + encodedImage}/>
            </div>;
  }

  return !selectedImage 
    ? buildGalleryView() 
    : buildSingleImageView(selectedImage.fileName, selectedImage.encodedImageData);
}

export default Gallery;
