"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { addLocation, toggleLocationActive } from "@/actions/shops";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plus, Eye, EyeOff } from "lucide-react";

type Location = {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
};

export function AdminLocationsClient({ locations: initialLocations }: { locations: Location[] }) {
  const [locations, setLocations] = useState<Location[]>(initialLocations);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const result = await addLocation(name, description || undefined);
    if (result.error) toast.error(result.error);
    else {
      toast.success("Location added");
      setName("");
      setDescription("");
      setShowAdd(false);
      // Optimistically add
      setLocations((prev) => [
        { id: Date.now().toString(), name, description, is_active: true, created_at: new Date().toISOString() },
        ...prev,
      ]);
    }
    setLoading(false);
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    const result = await toggleLocationActive(id, !isActive);
    if (result.error) toast.error(result.error);
    else {
      toast.success(isActive ? "Location disabled" : "Location enabled");
      setLocations((prev) =>
        prev.map((l) => l.id === id ? { ...l, is_active: !isActive } : l)
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Add location */}
      <Card>
        <CardContent className="p-4">
          {showAdd ? (
            <div className="space-y-3">
              <div>
                <Label className="mb-1.5 block">Location Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rathinam Campus"
                />
              </div>
              <div>
                <Label className="mb-1.5 block">Description (optional)</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAdd} disabled={loading || !name.trim()} size="sm">
                  {loading ? "Adding..." : "Add Location"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add New Location
            </button>
          )}
        </CardContent>
      </Card>

      {/* Locations list */}
      {locations.length === 0 ? (
        <div className="text-center py-12">
          <MapPin className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <p className="text-slate-500">No locations yet</p>
        </div>
      ) : (
        locations.map((location) => (
          <Card key={location.id} className={!location.is_active ? "opacity-60" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <MapPin className="w-4 h-4 text-blue-400" />
                    <h3 className="text-white font-semibold">{location.name}</h3>
                    <Badge variant={location.is_active ? "success" : "secondary"}>
                      {location.is_active ? "Active" : "Disabled"}
                    </Badge>
                  </div>
                  {location.description && (
                    <p className="text-slate-500 text-xs">{location.description}</p>
                  )}
                </div>

                <button
                  onClick={() => handleToggle(location.id, location.is_active)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-500 hover:text-white text-xs transition-colors"
                >
                  {location.is_active ? (
                    <><EyeOff className="w-3.5 h-3.5" /> Disable</>
                  ) : (
                    <><Eye className="w-3.5 h-3.5" /> Enable</>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

