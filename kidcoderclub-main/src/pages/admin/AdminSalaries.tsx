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
import { useToast } from "@/hooks/use-toast";
import { Search, RefreshCw, Plus, DollarSign, Clock, CheckCircle, Wallet } from "lucide-react";

interface Mentor {
  user_id: string;
  full_name: string;
}

interface Salary {
  id: string;
  mentor_id: string;
  amount: number;
  period: string;
  status: string;
  paid_at: string | null;
  created_at: string;
  mentor_name?: string;
}

const AdminSalaries = () => {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newSalary, setNewSalary] = useState({
    mentor_id: "",
    amount: "",
    period: "",
  });
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);

    // Fetch mentors
    const { data: mentorsData } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .eq("role", "mentor")
      .eq("approval_status", "approved");

    setMentors(mentorsData || []);

    // Fetch salaries
    const { data: salariesData, error } = await supabase
      .from("mentor_salaries")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching salaries:", error);
      setLoading(false);
      return;
    }

    // Map mentor names
    const salariesWithNames = (salariesData || []).map((salary) => {
      const mentor = mentorsData?.find((m) => m.user_id === salary.mentor_id);
      return {
        ...salary,
        mentor_name: mentor?.full_name || "Unknown",
      };
    });

    setSalaries(salariesWithNames);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    // Realtime subscription
    const channel = supabase
      .channel("mentor_salaries_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "mentor_salaries" },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAddSalary = async () => {
    if (!newSalary.mentor_id || !newSalary.amount || !newSalary.period) {
      toast({
        title: "Error",
        description: "Semua field harus diisi",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase.from("mentor_salaries").insert({
      mentor_id: newSalary.mentor_id,
      amount: parseFloat(newSalary.amount),
      period: newSalary.period,
      status: "pending",
    });

    if (error) {
      toast({
        title: "Error",
        description: "Gagal menambah data gaji",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Berhasil",
      description: "Data gaji berhasil ditambahkan",
    });

    setIsAddOpen(false);
    setNewSalary({ mentor_id: "", amount: "", period: "" });
    fetchData();
  };

  const handleMarkPaid = async (salaryId: string) => {
    const { error } = await supabase
      .from("mentor_salaries")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", salaryId);

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
      description: "Status pembayaran diperbarui",
    });

    fetchData();
  };

  const filteredSalaries = salaries.filter(
    (salary) =>
      salary.mentor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      salary.period.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPending = salaries
    .filter((s) => s.status === "pending")
    .reduce((sum, s) => sum + s.amount, 0);

  const totalPaid = salaries
    .filter((s) => s.status === "paid")
    .reduce((sum, s) => sum + s.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getCurrentPeriod = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Pembayaran Mentor</h1>
            <p className="text-slate-500">Kelola gaji dan pembayaran mentor</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchData} variant="outline" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Muat Ulang
            </Button>
            <Button onClick={() => setIsAddOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Gaji
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{salaries.length}</p>
                <p className="text-sm text-muted-foreground">Total Transaksi</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-yellow-500/10">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalPending)}</p>
                <p className="text-sm text-muted-foreground">Belum Dibayar</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/10">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatCurrency(totalPaid)}</p>
                <p className="text-sm text-muted-foreground">Sudah Dibayar</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nama mentor atau periode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Salaries Table */}
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Pembayaran</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mentor</TableHead>
                  <TableHead>Periode</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal Bayar</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Memuat data...
                    </TableCell>
                  </TableRow>
                ) : filteredSalaries.length > 0 ? (
                  filteredSalaries.map((salary) => (
                    <TableRow key={salary.id}>
                      <TableCell className="font-medium">{salary.mentor_name}</TableCell>
                      <TableCell>{salary.period}</TableCell>
                      <TableCell>{formatCurrency(salary.amount)}</TableCell>
                      <TableCell>
                        {salary.status === "paid" ? (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Dibayar
                          </Badge>
                        ) : (
                          <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {salary.paid_at
                          ? new Date(salary.paid_at).toLocaleDateString("id-ID")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {salary.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleMarkPaid(salary.id)}
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Bayar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Tidak ada data pembayaran
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Add Dialog */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Tambah Gaji Mentor</DialogTitle>
              <DialogDescription>
                Buat record pembayaran gaji untuk mentor
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Mentor</Label>
                <Select
                  value={newSalary.mentor_id}
                  onValueChange={(value) =>
                    setNewSalary({ ...newSalary, mentor_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih mentor" />
                  </SelectTrigger>
                  <SelectContent>
                    {mentors.map((mentor) => (
                      <SelectItem key={mentor.user_id} value={mentor.user_id}>
                        {mentor.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Periode (YYYY-MM)</Label>
                <Input
                  placeholder="2025-01"
                  value={newSalary.period}
                  onChange={(e) =>
                    setNewSalary({ ...newSalary, period: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Periode saat ini: {getCurrentPeriod()}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Jumlah (IDR)</Label>
                <Input
                  type="number"
                  placeholder="1000000"
                  value={newSalary.amount}
                  onChange={(e) =>
                    setNewSalary({ ...newSalary, amount: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleAddSalary}>Tambah</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminSalaries;
