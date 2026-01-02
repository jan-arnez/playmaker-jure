"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Save, Search, Star, Clock, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Facility {
  id: string;
  name: string;
  city: string;
  organization: { name: string };
}

interface HomepageCMSProps {
  facilities: Facility[];
  initialSettings: {
    featuredFacilities: string[];
    popularFacilities: string[];
    freeThisWeekend: string[];
  };
}

export function HomepageCMS({ facilities, initialSettings }: HomepageCMSProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [saving, setSaving] = useState(false);
  
  const [featured, setFeatured] = useState<string[]>(initialSettings.featuredFacilities || []);
  const [popular, setPopular] = useState<string[]>(initialSettings.popularFacilities || []);
  const [freeWeekend, setFreeWeekend] = useState<string[]>(initialSettings.freeThisWeekend || []);

  const filteredFacilities = facilities.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.organization.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFacility = (list: string[], setList: (ids: string[]) => void, id: string) => {
    if (list.includes(id)) {
      setList(list.filter(i => i !== id));
    } else {
      setList([...list, id]);
    }
  };

  const saveFacilitySettings = async () => {
    setSaving(true);
    try {
      const settings = [
        { key: "homepage.featuredFacilities", value: featured, category: "homepage" },
        { key: "homepage.popularFacilities", value: popular, category: "homepage" },
        { key: "homepage.freeThisWeekend", value: freeWeekend, category: "homepage" },
      ];

      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) throw new Error("Failed to save");
      toast.success("Homepage settings saved!");
    } catch {
      toast.error("Failed to save homepage settings");
    } finally {
      setSaving(false);
    }
  };

  const getFacilityById = (id: string) => facilities.find(f => f.id === id);

  return (
    <div className="space-y-6">
      {/* Selected Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Featured Facilities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{featured.length}</div>
            <p className="text-xs text-muted-foreground">Will appear prominently on homepage</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Star className="h-4 w-4 text-green-500" />
              Popular Facilities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{popular.length}</div>
            <p className="text-xs text-muted-foreground">Shown in "Popular" section</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              Free This Weekend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{freeWeekend.length}</div>
            <p className="text-xs text-muted-foreground">Appear in "Free" tabs</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search facilities..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Facility Selection Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Select Facilities for Homepage</CardTitle>
          <CardDescription>
            Choose which facilities appear in each homepage section
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {filteredFacilities.map((facility) => (
                <div
                  key={facility.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <p className="font-medium">{facility.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {facility.city} • {facility.organization.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={featured.includes(facility.id)}
                        onCheckedChange={() => toggleFacility(featured, setFeatured, facility.id)}
                      />
                      <span className="text-xs">Featured</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={popular.includes(facility.id)}
                        onCheckedChange={() => toggleFacility(popular, setPopular, facility.id)}
                      />
                      <span className="text-xs">Popular</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={freeWeekend.includes(facility.id)}
                        onCheckedChange={() => toggleFacility(freeWeekend, setFreeWeekend, facility.id)}
                      />
                      <span className="text-xs">Free</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Selected Items Preview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Featured</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {featured.length === 0 ? (
              <p className="text-xs text-muted-foreground">None selected</p>
            ) : (
              featured.map(id => {
                const f = getFacilityById(id);
                return f ? (
                  <Badge key={id} variant="secondary" className="mr-1 mb-1">
                    {f.name}
                  </Badge>
                ) : null;
              })
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Popular</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {popular.length === 0 ? (
              <p className="text-xs text-muted-foreground">None selected</p>
            ) : (
              popular.map(id => {
                const f = getFacilityById(id);
                return f ? (
                  <Badge key={id} variant="secondary" className="mr-1 mb-1">
                    {f.name}
                  </Badge>
                ) : null;
              })
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Free This Weekend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {freeWeekend.length === 0 ? (
              <p className="text-xs text-muted-foreground">None selected</p>
            ) : (
              freeWeekend.map(id => {
                const f = getFacilityById(id);
                return f ? (
                  <Badge key={id} variant="secondary" className="mr-1 mb-1">
                    {f.name}
                  </Badge>
                ) : null;
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <Button onClick={saveFacilitySettings} disabled={saving} className="w-full">
        <Save className="h-4 w-4 mr-2" />
        Save Homepage Settings
      </Button>
    </div>
  );
}
