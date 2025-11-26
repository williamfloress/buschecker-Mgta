import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { busStopApi, routeApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { BusStop, BusRoute, InsertBusStop } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash2, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MapView from "@/components/MapView";

export default function AdminView() {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStop, setEditingStop] = useState<BusStop | null>(null);
  const [deleteStopId, setDeleteStopId] = useState<string | null>(null);
  const [mapClickLocation, setMapClickLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Form state
  const [formData, setFormData] = useState<InsertBusStop>({
    name: "",
    latitude: 11.0041, // Default to Isla de Margarita
    longitude: -63.8497,
  });

  // Fetch all bus stops
  const { data: busStops = [], isLoading: stopsLoading } = useQuery({
    queryKey: ["bus-stops"],
    queryFn: busStopApi.getAll,
  });

  // Fetch all routes
  const { data: routes = [] } = useQuery({
    queryKey: ["routes"],
    queryFn: routeApi.getAll,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: busStopApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bus-stops"] });
      setIsCreateDialogOpen(false);
      setFormData({ name: "", latitude: 11.0041, longitude: -63.8497 });
      setMapClickLocation(null);
      toast({
        title: "Parada creada",
        description: "La parada de autobús se ha creado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la parada.",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertBusStop> }) =>
      busStopApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bus-stops"] });
      setIsEditDialogOpen(false);
      setEditingStop(null);
      setFormData({ name: "", latitude: 11.0041, longitude: -63.8497 });
      setMapClickLocation(null);
      toast({
        title: "Parada actualizada",
        description: "La parada de autobús se ha actualizado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la parada.",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: busStopApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bus-stops"] });
      setDeleteStopId(null);
      toast({
        title: "Parada eliminada",
        description: "La parada de autobús se ha eliminado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la parada.",
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    if (!isAdmin) {
      toast({
        title: "Acceso denegado",
        description: "Solo los administradores pueden crear paradas.",
        variant: "destructive",
      });
      return;
    }
    if (!formData.name || !formData.latitude || !formData.longitude) {
      toast({
        title: "Campos requeridos",
        description: "Por favor complete todos los campos.",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (stop: BusStop) => {
    setEditingStop(stop);
    setFormData({
      name: stop.name,
      latitude: stop.latitude,
      longitude: stop.longitude,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!isAdmin) {
      toast({
        title: "Acceso denegado",
        description: "Solo los administradores pueden actualizar paradas.",
        variant: "destructive",
      });
      return;
    }
    if (!editingStop || !formData.name || !formData.latitude || !formData.longitude) {
      toast({
        title: "Campos requeridos",
        description: "Por favor complete todos los campos.",
        variant: "destructive",
      });
      return;
    }
    updateMutation.mutate({ id: editingStop.id, data: formData });
  };

  const handleDelete = (id: string) => {
    if (!isAdmin) {
      toast({
        title: "Acceso denegado",
        description: "Solo los administradores pueden eliminar paradas.",
        variant: "destructive",
      });
      return;
    }
    deleteMutation.mutate(id);
  };

  const handleMapClick = (lat: number, lng: number) => {
    setMapClickLocation({ lat, lng });
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
  };

  const handleOpenCreateDialog = () => {
    setFormData({ name: "", latitude: 11.0041, longitude: -63.8497 });
    setMapClickLocation(null);
    setIsCreateDialogOpen(true);
  };

  return (
    <div className="h-full flex flex-col gap-4" data-testid="view-admin">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Administración de Paradas</h1>
          <p className="text-sm text-muted-foreground">
            Gestiona las paradas de autobús del sistema
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Parada
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nueva Parada</DialogTitle>
              <DialogDescription>
                Complete la información de la parada. Haga clic en el mapa para seleccionar la ubicación.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre de la Parada</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ej: Parada Central"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label htmlFor="latitude">Latitud</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        latitude: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="longitude">Longitud</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        longitude: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Seleccionar Ubicación en el Mapa</Label>
                <div className="h-64 rounded-md overflow-hidden border relative">
                  <MapView
                    buses={[]}
                    busStops={mapClickLocation ? [{
                      id: 'temp-selected',
                      name: 'Ubicación seleccionada',
                      latitude: mapClickLocation.lat,
                      longitude: mapClickLocation.lng,
                      routeId: null
                    }] : []}
                    onMapClick={handleMapClick}
                    className="h-full"
                  />
                </div>
                {mapClickLocation && (
                  <p className="text-xs text-muted-foreground">
                    Ubicación seleccionada: {mapClickLocation.lat.toFixed(6)},{" "}
                    {mapClickLocation.lng.toFixed(6)}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? "Creando..." : "Crear Parada"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Parada</DialogTitle>
            <DialogDescription>
              Modifique la información de la parada. Haga clic en el mapa para cambiar la ubicación.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nombre de la Parada</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Ej: Parada Central"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-latitude">Latitud</Label>
                <Input
                  id="edit-latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      latitude: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-longitude">Longitud</Label>
                <Input
                  id="edit-longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      longitude: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Seleccionar Ubicación en el Mapa</Label>
              <div className="h-64 rounded-md overflow-hidden border relative">
                <MapView
                  buses={[]}
                  busStops={[
                    ...(editingStop ? [editingStop] : []),
                    ...(mapClickLocation ? [{
                      id: 'temp-selected',
                      name: 'Nueva ubicación',
                      latitude: mapClickLocation.lat,
                      longitude: mapClickLocation.lng,
                      routeId: null
                    }] : [])
                  ]}
                  onMapClick={handleMapClick}
                  className="h-full"
                />
              </div>
              {mapClickLocation && (
                <p className="text-xs text-muted-foreground">
                  Nueva ubicación seleccionada: {mapClickLocation.lat.toFixed(6)},{" "}
                  {mapClickLocation.lng.toFixed(6)}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Actualizando..." : "Actualizar Parada"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bus Stops Table */}
      <div className="flex-1 border rounded-md">
        {stopsLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Cargando paradas...</p>
          </div>
        ) : busStops.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <MapPin className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay paradas registradas</p>
            <p className="text-sm text-muted-foreground">
              Crea tu primera parada usando el botón "Nueva Parada"
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Latitud</TableHead>
                <TableHead>Longitud</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {busStops.map((stop) => (
                <TableRow key={stop.id}>
                  <TableCell className="font-medium">{stop.name}</TableCell>
                  <TableCell>{stop.latitude.toFixed(6)}</TableCell>
                  <TableCell>{stop.longitude.toFixed(6)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(stop)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteStopId(stop.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará
                              permanentemente la parada "{stop.name}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(stop.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

