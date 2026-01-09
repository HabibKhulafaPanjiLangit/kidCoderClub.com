import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Search, Edit, Users, BookOpen, RefreshCw, Check, X, Eye, Clock, CheckCircle, XCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Mentor {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  expertise: string | null;
  experience: string | null;
  bio: string | null;
  phone: string | null;
  certificate_url: string | null;
  approval_status: string | null;
  created_at: string;
  classCount?: number;
  studentCount?: number;
}

const AdminMentors = () => {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCertificateOpen, setIsCertificateOpen] = useState(false);
  const [editData, setEditData] = useState({
    full_name: "",
    expertise: "",
    experience: "",
    bio: "",
    phone: "",
  });
  const { toast } = useToast();

  const fetchMentors = async () => {
    setLoading(true);

    const { data: mentorData, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "mentor")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching mentors:", error);
      setLoading(false);
      return;
    }

    const mentorsWithStats = await Promise.all(
      (mentorData || []).map(async (mentor) => {
        const { data: classes } = await supabase
          .from("classes")
          .select("id")
          .eq("mentor_id", mentor.user_id);

        const classIds = classes?.map((c) => c.id) || [];
        let studentCount = 0;

        if (classIds.length > 0) {
          const { count } = await supabase
            .from("enrollments")
            .select("user_id", { count: "exact", head: true })
            .in("class_id", classIds);
          studentCount = count || 0;
        }

        return {
          ...mentor,
          classCount: classes?.length || 0,
          studentCount,
        };
      })
    );

    setMentors(mentorsWithStats);
    setLoading(false);
  };

  useEffect(() => {
    fetchMentors();
  }, []);

  const handleEditClick = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    setEditData({
      full_name: mentor.full_name,
      expertise: mentor.expertise || "",
      experience: mentor.experience || "",
      bio: mentor.bio || "",
      phone: mentor.phone || "",
    });
    setIsEditOpen(true);
  };

  const handleViewCertificate = (mentor: Mentor) => {
    setSelectedMentor(mentor);
    setIsCertificateOpen(true);
  };

  const handleApproval = async (mentor: Mentor, status: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from("profiles")
      .update({ approval_status: status })
      .eq("id", mentor.id);

    if (error) {
      toast({
        title: "Error",
        description: "Gagal mengubah status",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Berhasil",
      description: `Mentor ${status === 'approved' ? 'disetujui' : 'ditolak'}`,
    });

    fetchMentors();
  };

  const handleSaveEdit = async () => {
    if (!selectedMentor) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: editData.full_name,
        expertise: editData.expertise || null,
        experience: editData.experience || null,
        bio: editData.bio || null,
        phone: editData.phone || null,
      })
      .eq("id", selectedMentor.id);

    if (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan perubahan",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Berhasil",
      description: "Data mentor berhasil diperbarui",
    });

    setIsEditOpen(false);
    fetchMentors();
  };

  const filteredMentors = mentors.filter((mentor) => {
    const matchesSearch =
      mentor.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mentor.expertise?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || mentor.approval_status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="w-3 h-3 mr-1" />Disetujui</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20"><XCircle className="w-3 h-3 mr-1" />Ditolak</Badge>;
      default:
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Clock className="w-3 h-3 mr-1" />Menunggu</Badge>;
    }
  };

  const pendingCount = mentors.filter(m => m.approval_status === 'pending' || !m.approval_status).length;
  const approvedCount = mentors.filter(m => m.approval_status === 'approved').length;

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Kelola Mentor</h1>
            <p className="text-slate-500">Lihat, kelola, dan approve mentor terdaftar</p>
          </div>
          <Button onClick={fetchMentors} variant="outline" disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Muat Ulang
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mentors.length}</p>
                <p className="text-sm text-muted-foreground">Total Mentor</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-yellow-500/10">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Menunggu Approval</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/10">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approvedCount}</p>
                <p className="text-sm text-muted-foreground">Disetujui</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-secondary/10">
                <BookOpen className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {mentors.reduce((sum, m) => sum + (m.classCount || 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Kelas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari mentor berdasarkan nama atau keahlian..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="pending">Menunggu</SelectItem>
                  <SelectItem value="approved">Disetujui</SelectItem>
                  <SelectItem value="rejected">Ditolak</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Mentors Table */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Mentor</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mentor</TableHead>
                  <TableHead>Keahlian</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sertifikat</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Siswa</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : filteredMentors.length > 0 ? (
                  filteredMentors.map((mentor) => (
                    <TableRow key={mentor.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={mentor.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(mentor.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{mentor.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {mentor.phone || "No phone"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {mentor.expertise ? (
                          <Badge variant="secondary">{mentor.expertise}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(mentor.approval_status)}
                      </TableCell>
                      <TableCell>
                        {mentor.certificate_url ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewCertificate(mentor)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Lihat
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">Tidak ada</span>
                        )}
                      </TableCell>
                      <TableCell>{mentor.classCount}</TableCell>
                      <TableCell>{mentor.studentCount}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {(mentor.approval_status === 'pending' || !mentor.approval_status) && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleApproval(mentor, 'approved')}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleApproval(mentor, 'rejected')}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(mentor)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Tidak ada mentor ditemukan
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Data Mentor</DialogTitle>
              <DialogDescription>
                Perbarui informasi mentor di bawah ini
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit_name">Nama Lengkap</Label>
                <Input
                  id="edit_name"
                  value={editData.full_name}
                  onChange={(e) =>
                    setEditData({ ...editData, full_name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_expertise">Keahlian</Label>
                <Input
                  id="edit_expertise"
                  value={editData.expertise}
                  onChange={(e) =>
                    setEditData({ ...editData, expertise: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_experience">Pengalaman</Label>
                <Input
                  id="edit_experience"
                  value={editData.experience}
                  onChange={(e) =>
                    setEditData({ ...editData, experience: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_phone">Nomor Telepon</Label>
                <Input
                  id="edit_phone"
                  value={editData.phone}
                  onChange={(e) =>
                    setEditData({ ...editData, phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit_bio">Bio</Label>
                <Textarea
                  id="edit_bio"
                  value={editData.bio}
                  onChange={(e) =>
                    setEditData({ ...editData, bio: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleSaveEdit}>Simpan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Certificate Dialog */}
        <Dialog open={isCertificateOpen} onOpenChange={setIsCertificateOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Sertifikat - {selectedMentor?.full_name}</DialogTitle>
              <DialogDescription>
                Preview sertifikat keahlian mentor
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {selectedMentor?.certificate_url && (
                <div className="border rounded-lg overflow-hidden">
                  {selectedMentor.certificate_url.toLowerCase().endsWith('.pdf') ? (
                    <iframe
                      src={selectedMentor.certificate_url}
                      className="w-full h-96"
                      title="Certificate PDF"
                    />
                  ) : (
                    <img
                      src={selectedMentor.certificate_url}
                      alt="Certificate"
                      className="w-full max-h-96 object-contain"
                    />
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCertificateOpen(false)}>
                Tutup
              </Button>
              {selectedMentor?.certificate_url && (
                <Button asChild>
                  <a href={selectedMentor.certificate_url} target="_blank" rel="noopener noreferrer">
                    Buka di Tab Baru
                  </a>
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminMentors;
