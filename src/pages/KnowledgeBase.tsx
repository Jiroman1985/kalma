import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { db, storage } from "@/lib/firebase";
import { 
  doc, 
  collection,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
} from "firebase/storage";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Progress
} from "@/components/ui/progress";
import { 
  FileText, 
  Upload, 
  Trash2, 
  File, 
  Database, 
  FileSpreadsheet, 
  FileCode,
  Loader2,
  Eye
} from "lucide-react";

// Interfaz para los documentos
interface KnowledgeDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadDate: any; // Date from Firestore
  storageRef: string;
  downloadUrl: string;
  content?: string;
}

const KnowledgeBase = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<KnowledgeDocument | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cargar los documentos al iniciar
  useEffect(() => {
    loadDocuments();
  }, [currentUser]);

  // Cargar documentos desde Firestore
  const loadDocuments = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const docsRef = collection(db, "users", currentUser.uid, "knowledgeDocuments");
      const q = query(docsRef, orderBy("uploadDate", "desc"));
      const querySnapshot = await getDocs(q);
      
      const loadedDocs: KnowledgeDocument[] = [];
      querySnapshot.forEach((doc) => {
        loadedDocs.push({
          id: doc.id,
          ...doc.data()
        } as KnowledgeDocument);
      });
      
      setDocuments(loadedDocs);
    } catch (error) {
      console.error("Error al cargar documentos:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los documentos. Por favor, intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Manejar subida de archivo
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !currentUser) return;
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      const file = files[0];
      
      // Verificar el tipo de archivo
      const allowedTypes = [
        'application/pdf', // PDF
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
        'application/msword', // DOC
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
        'application/vnd.ms-excel', // XLS
        'text/csv', // CSV
        'text/plain' // TXT
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Tipo de archivo no permitido",
          description: "Solo se permiten archivos PDF, Word, Excel o CSV.",
          variant: "destructive"
        });
        setUploading(false);
        return;
      }
      
      // Crear referencia en Storage
      const storageRef = ref(storage, `users/${currentUser.uid}/documents/${Date.now()}_${file.name}`);
      
      // Subir archivo
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      // Escuchar eventos de progreso
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Error al subir archivo:", error);
          toast({
            title: "Error al subir",
            description: "No se pudo subir el archivo. Por favor, intenta de nuevo.",
            variant: "destructive"
          });
          setUploading(false);
        },
        async () => {
          // Subida completada con éxito
          try {
            // Obtener URL de descarga
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Guardar información del documento en Firestore
            const docRef = collection(db, "users", currentUser.uid, "knowledgeDocuments");
            await addDoc(docRef, {
              fileName: file.name,
              fileType: file.type,
              fileSize: file.size,
              uploadDate: serverTimestamp(),
              storageRef: uploadTask.snapshot.ref.fullPath,
              downloadUrl: downloadUrl,
              content: "Contenido extraído del documento" // Simulado por ahora
            });
            
            toast({
              title: "Documento subido",
              description: `${file.name} se ha subido correctamente.`
            });
            
            // Recargar documentos
            await loadDocuments();
          } catch (error) {
            console.error("Error al guardar documento en Firestore:", error);
          } finally {
            setUploading(false);
            // Limpiar input de archivos
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }
        }
      );
      
    } catch (error) {
      console.error("Error al procesar documento:", error);
      toast({
        title: "Error",
        description: "No se pudo procesar el documento. Por favor, intenta de nuevo.",
        variant: "destructive"
      });
      setUploading(false);
      // Limpiar input de archivos
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Preparar eliminación de documento
  const prepareDeleteDocument = (document: KnowledgeDocument) => {
    setDocumentToDelete(document);
    setDeleteDialogOpen(true);
  };

  // Eliminar documento
  const deleteDocument = async () => {
    if (!documentToDelete || !currentUser) return;
    
    try {
      // Eliminar archivo de Storage
      if (documentToDelete.storageRef) {
        const storageReference = ref(storage, documentToDelete.storageRef);
        await deleteObject(storageReference);
      }
      
      // Eliminar documento de Firestore
      await deleteDoc(doc(db, "users", currentUser.uid, "knowledgeDocuments", documentToDelete.id));
      
      toast({
        title: "Documento eliminado",
        description: `${documentToDelete.fileName} ha sido eliminado correctamente.`
      });
      
      // Actualizar lista de documentos
      setDocuments(documents.filter(doc => doc.id !== documentToDelete.id));
      
    } catch (error) {
      console.error("Error al eliminar documento:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el documento. Por favor, intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  // Función para formatear el tamaño del archivo
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Función para obtener el icono según el tipo de archivo
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return <FileText className="w-8 h-8 text-red-500" />;
    } else if (fileType.includes('word')) {
      return <FileText className="w-8 h-8 text-blue-500" />;
    } else if (fileType.includes('excel') || fileType.includes('spreadsheet') || fileType.includes('csv')) {
      return <FileSpreadsheet className="w-8 h-8 text-green-500" />;
    } else {
      return <File className="w-8 h-8 text-gray-500" />;
    }
  };

  // Función para abrir el documento
  const openDocument = (downloadUrl: string) => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Base de conocimiento</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Documentos de conocimiento
          </CardTitle>
          <CardDescription>
            Sube documentos para que tu agente de IA pueda responder basándose en ellos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sección de subida de archivos */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
            />
            {uploading ? (
              <div className="flex flex-col items-center space-y-4">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
                <p className="text-gray-600">Subiendo documento...</p>
                <div className="w-full max-w-xs">
                  <Progress value={uploadProgress} className="h-2 bg-gray-200" />
                  <p className="text-xs text-gray-500 mt-1">{Math.round(uploadProgress)}% completado</p>
                </div>
              </div>
            ) : (
              <div>
                <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <h3 className="text-lg font-medium mb-1">Sube tus documentos</h3>
                <p className="text-gray-500 mb-3">
                  Arrastra y suelta o haz clic para seleccionar archivos
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  Seleccionar archivos
                </Button>
                <p className="text-xs text-gray-400 mt-2">
                  Formatos permitidos: PDF, Word, Excel, CSV
                </p>
              </div>
            )}
          </div>
          
          {/* Lista de documentos */}
          <div>
            <h3 className="text-lg font-medium mb-3">Documentos subidos</h3>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No hay documentos subidos. Sube tus primeros documentos para comenzar.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div 
                    key={doc.id} 
                    className="p-4 border rounded-lg hover:bg-gray-50 transition-colors flex justify-between items-center"
                  >
                    <div className="flex items-center gap-3">
                      {getFileIcon(doc.fileType)}
                      <div>
                        <p className="font-medium">{doc.fileName}</p>
                        <div className="flex gap-2 text-xs text-gray-500">
                          <span>{formatFileSize(doc.fileSize)}</span>
                          <span>•</span>
                          <span>
                            {doc.uploadDate?.toDate 
                              ? doc.uploadDate.toDate().toLocaleDateString() 
                              : 'Fecha desconocida'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {doc.downloadUrl && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => openDocument(doc.downloadUrl)}
                          title="Ver documento"
                        >
                          <Eye className="h-5 w-5 text-blue-500" />
                          <span className="sr-only">Ver</span>
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => prepareDeleteDocument(doc)}
                        title="Eliminar documento"
                      >
                        <Trash2 className="h-5 w-5 text-red-500" />
                        <span className="sr-only">Eliminar</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Diálogo de confirmación para eliminar */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Eliminarás permanentemente el documento{' '}
              <span className="font-semibold">{documentToDelete?.fileName}</span> de tu base de conocimiento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteDocument}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default KnowledgeBase; 