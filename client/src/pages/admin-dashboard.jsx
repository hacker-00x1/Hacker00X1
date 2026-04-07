import { GlitchText } from "@/components/cyber-effects";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBlogSchema, insertWriteupSchema, insertBookSchema } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Plus, Edit, Trash2, LogOut, User, MessageSquare, Terminal, ShieldAlert, FileText, BookOpen } from "lucide-react";
import { MatrixBackground } from "@/components/matrix-background";

export default function AdminDashboard() {
  const { logoutMutation } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("blogs");
  const [editingItem, setEditingItem] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedPdf, setSelectedPdf] = useState(null);

  const { data: blogs, isLoading: loadingBlogs } = useQuery({
    queryKey: ["/api/blogs"],
  });

  const { data: writeups, isLoading: loadingWriteups } = useQuery({
    queryKey: ["/api/writeups"],
  });

  const { data: books, isLoading: loadingBooks } = useQuery({
    queryKey: ["/api/books"],
  });

  const { data: about, isLoading: loadingAbout } = useQuery({
    queryKey: ["/api/about"],
  });

  const [aboutContent, setAboutContent] = useState("");

  useEffect(() => {
    if (about?.content) {
      setAboutContent(about.content);
    }
  }, [about]);

  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ["/api/messages"],
  });

  const createBlogMutation = useMutation({
    mutationFn: async (data) => {
      const res = await apiRequest("POST", "/api/blogs", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blogs"] });
      toast({ title: "SUCCESS", description: "BLOG_POST_INITIALIZED" });
      setIsDialogOpen(false);
    },
  });

  const updateBlogMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await apiRequest("PATCH", `/api/blogs/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blogs"] });
      toast({ title: "SUCCESS", description: "BLOG_POST_UPDATED" });
      setIsDialogOpen(false);
      setEditingItem(null);
    },
  });

  const deleteBlogMutation = useMutation({
    mutationFn: async (id) => {
      await apiRequest("DELETE", `/api/blogs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/blogs"] });
      toast({ title: "SUCCESS", description: "BLOG_POST_DELETED" });
    },
  });

  const createWriteupMutation = useMutation({
    mutationFn: async (data) => {
      const res = await apiRequest("POST", "/api/writeups", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/writeups"] });
      toast({ title: "SUCCESS", description: "WRITEUP_INITIALIZED" });
      setIsDialogOpen(false);
    },
  });

  const updateWriteupMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await apiRequest("PATCH", `/api/writeups/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/writeups"] });
      toast({ title: "SUCCESS", description: "WRITEUP_UPDATED" });
      setIsDialogOpen(false);
      setEditingItem(null);
    },
  });

  const deleteWriteupMutation = useMutation({
    mutationFn: async (id) => {
      await apiRequest("DELETE", `/api/writeups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/writeups"] });
      toast({ title: "SUCCESS", description: "WRITEUP_DELETED" });
    },
  });

  const createBookMutation = useMutation({
    mutationFn: async (data) => {
      const res = await apiRequest("POST", "/api/books", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      toast({ title: "SUCCESS", description: "BOOK_RESOURCE_ADDED" });
      setIsDialogOpen(false);
    },
  });

  const updateBookMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await apiRequest("PATCH", `/api/books/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      toast({ title: "SUCCESS", description: "BOOK_RESOURCE_UPDATED" });
      setIsDialogOpen(false);
      setEditingItem(null);
    },
  });

  const deleteBookMutation = useMutation({
    mutationFn: async (id) => {
      await apiRequest("DELETE", `/api/books/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      toast({ title: "SUCCESS", description: "BOOK_RESOURCE_DELETED" });
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (id) => {
      await apiRequest("DELETE", `/api/messages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      toast({ title: "SUCCESS", description: "INTEL_REMOVED" });
    },
  });

  const updateAboutMutation = useMutation({
    mutationFn: async (content) => {
      const res = await apiRequest("PATCH", "/api/about", { content });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/about"] });
      toast({ title: "SUCCESS", description: "ABOUT_ME_UPDATED" });
    },
  });

  const blogForm = useForm({
    resolver: zodResolver(insertBlogSchema),
    defaultValues: editingItem?.type === "blog" ? editingItem.data : {
      title: "",
      excerpt: "",
      date: new Date().toISOString().split('T')[0],
      readTime: "5 min read",
      author: "Hacker00x1",
      image: "/blog-images/default.png",
      content: "",
    },
  });

  const writeupForm = useForm({
    resolver: zodResolver(insertWriteupSchema),
    defaultValues: editingItem?.type === "writeup" ? editingItem.data : {
      title: "",
      excerpt: "",
      date: new Date().toISOString().split('T')[0],
      readTime: "5 min read",
      category: "Web Security",
      author: "Hacker00x1",
      severity: "Medium",
      sourceUrl: "#",
      image: "/writeup-images/default.png",
      content: "",
    },
  });

  const bookForm = useForm({
    resolver: zodResolver(insertBookSchema),
    defaultValues: editingItem?.type === "book" ? editingItem.data : {
      title: "",
      author: "",
      cover: "/Media/book-images/default.png",
      desc: "",
      link: "#",
    },
  });

  const onBlogSubmit = async (data) => {
    let imageUrl = data.image || "/blog-images/default.png";
    if (selectedFile) {
      setUploading(true);
      const formData = new FormData();
      formData.append("image", selectedFile);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Upload failed");
        const result = await res.json();
        imageUrl = result.imageUrl;
      } catch (error) {
        toast({ title: "UPLOAD_FAILED", description: error.message, variant: "destructive" });
        setUploading(false);
        return;
      }
      setUploading(false);
    }
    const finalData = { ...data, image: imageUrl };
    if (editingItem) {
      updateBlogMutation.mutate({ id: editingItem.data.id, data: finalData });
    } else {
      createBlogMutation.mutate(finalData);
    }
  };

  const onWriteupSubmit = async (data) => {
    let imageUrl = data.image || "/writeup-images/default.png";
    if (selectedFile) {
      setUploading(true);
      const formData = new FormData();
      formData.append("image", selectedFile);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Upload failed");
        const result = await res.json();
        imageUrl = result.imageUrl;
      } catch (error) {
        toast({ title: "UPLOAD_FAILED", description: error.message, variant: "destructive" });
        setUploading(false);
        return;
      }
      setUploading(false);
    }
    const finalData = { ...data, image: imageUrl };
    if (editingItem) {
      updateWriteupMutation.mutate({ id: editingItem.data.id, data: finalData });
    } else {
      createWriteupMutation.mutate(finalData);
    }
  };

  const onBookSubmit = async (data) => {
    let coverUrl = data.cover || "/Media/book-images/default.png";
    let pdfUrl = data.link || "#";

    if (selectedFile || selectedPdf) {
      setUploading(true);
      try {
        if (selectedFile) {
          const formData = new FormData();
          formData.append("image", selectedFile);
          const res = await fetch("/api/upload", { method: "POST", body: formData });
          if (!res.ok) throw new Error("Cover upload failed");
          const result = await res.json();
          coverUrl = result.imageUrl;
        }

        if (selectedPdf) {
          const formData = new FormData();
          formData.append("image", selectedPdf); // using same endpoint for now
          const res = await fetch("/api/upload", { method: "POST", body: formData });
          if (!res.ok) throw new Error("PDF upload failed");
          const result = await res.json();
          pdfUrl = result.imageUrl;
        }
      } catch (error) {
        toast({ title: "UPLOAD_FAILED", description: error.message, variant: "destructive" });
        setUploading(false);
        return;
      }
      setUploading(false);
    }
    const finalData = { ...data, cover: coverUrl, link: pdfUrl };
    if (editingItem) {
      updateBookMutation.mutate({ id: editingItem.data.id, data: finalData });
    } else {
      createBookMutation.mutate(finalData);
    }
  };

  const handleEdit = (item, type) => {
    setEditingItem({ type, data: item });
    setSelectedFile(null);
    setSelectedPdf(null);
    if (type === "blog") blogForm.reset(item);
    else if (type === "writeup") writeupForm.reset(item);
    else if (type === "book") bookForm.reset(item);
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setSelectedFile(null);
    setSelectedPdf(null);
    blogForm.reset({
      title: "", excerpt: "", date: new Date().toISOString().split('T')[0],
      readTime: "5 min read", author: "Hacker00x1", image: "/blog-images/default.png", content: "",
    });
    writeupForm.reset({
      title: "", excerpt: "", date: new Date().toISOString().split('T')[0],
      readTime: "5 min read", category: "Web Security", author: "Hacker00x1",
      severity: "Medium", sourceUrl: "#", image: "/writeup-images/default.png", content: "",
    });
    bookForm.reset({
      title: "", author: "", cover: "/Media/book-images/default.png", desc: "", link: "#",
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-black text-cyan-500 font-mono p-4 md:p-8 relative overflow-x-hidden selection:bg-cyan-500/30">
      <MatrixBackground />
      <div className="scanline pointer-events-none fixed inset-0 z-50 opacity-10" />
      
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 relative z-10">
        <header className="flex flex-col md:flex-row justify-between items-center gap-4 border border-cyan-900/50 bg-black/60 backdrop-blur-xl p-4 md:p-6 rounded-xl shadow-[0_0_30px_rgba(0,255,255,0.1)] border-b-cyan-500/30">
          <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-cyan-500/10 border border-cyan-500/50 flex items-center justify-center shrink-0 animate-pulse">
              <Terminal className="text-cyan-400 w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-3xl font-black tracking-[0.1em] md:tracking-[0.2em] text-cyan-400 uppercase truncate">
                <GlitchText text="Admin_Dashboard" />
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-green-500 animate-ping" />
                <p className="text-cyan-700 text-[8px] md:text-[10px] uppercase tracking-widest truncate">
                  System Online // User: Hacker00X1
                </p>
              </div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full md:w-auto border border-red-900/30 text-red-500/70 hover:bg-red-950/20 hover:text-red-400 transition-all text-xs md:text-sm h-9 md:h-10"
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4 mr-2" />
            TERMINATE_SESSION
          </Button>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 md:space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
            {[
              { id: "blogs", label: "BLOGS", count: blogs?.length || 0, icon: FileText },
              { id: "writeups", label: "WRITEUPS", count: writeups?.length || 0, icon: ShieldAlert },
              { id: "books", label: "BOOKS", count: books?.length || 0, icon: BookOpen },
              { id: "about", label: "BIO", count: null, icon: User },
              { id: "messages", label: "INTEL", count: messages?.length || 0, icon: MessageSquare },
            ].map((tab) => (
              <Card 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`cursor-pointer transition-all duration-300 border-2 ${
                  activeTab === tab.id 
                    ? "bg-cyan-500/10 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.2)]" 
                    : "bg-black/40 border-cyan-900/30 hover:border-cyan-500/50 hover:bg-cyan-500/5"
                } ${tab.id === "messages" && "col-span-2 sm:col-span-1"}`}
              >
                <CardContent className="p-3 md:p-6 flex flex-col items-center justify-center text-center space-y-1.5 md:space-y-2">
                  <tab.icon className={`w-5 h-5 md:w-6 md:h-6 ${activeTab === tab.id ? "text-cyan-400" : "text-cyan-700"}`} />
                  <div className="space-y-0.5 md:space-y-1">
                    <p className={`text-[10px] md:text-xs font-black tracking-widest uppercase ${activeTab === tab.id ? "text-cyan-400" : "text-cyan-600"}`}>
                      {tab.label}
                    </p>
                    {tab.count !== null && (
                      <p className={`text-base md:text-xl font-black ${activeTab === tab.id ? "text-white" : "text-cyan-900"}`}>
                        ({tab.count})
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-center md:justify-end">
            {["blogs", "writeups", "books"].includes(activeTab) && (
              <Button className="w-full md:w-auto bg-cyan-600 hover:bg-cyan-500 text-black font-black tracking-tighter px-8 py-6 md:py-2 shadow-[0_0_20px_rgba(6,182,212,0.3)]" onClick={handleAddNew}>
                <Plus className="w-5 h-5 mr-2" />
                NEW_ENTRY
              </Button>
            )}
          </div>

          <TabsContent value="blogs" className="mt-0 outline-none">
            <Card className="bg-black/40 border-cyan-900/30 backdrop-blur-md overflow-hidden">
              <CardContent className="p-0 overflow-x-auto">
                {loadingBlogs ? (
                  <div className="flex justify-center p-12 md:p-20"><Loader2 className="w-8 h-8 md:w-10 md:h-10 animate-spin text-cyan-500" /></div>
                ) : (
                  <div className="min-w-[600px] md:min-w-full">
                    <Table>
                      <TableHeader className="bg-cyan-950/20">
                        <TableRow className="border-cyan-900/30 hover:bg-transparent">
                          <TableHead className="text-cyan-500/50 font-black text-[10px] tracking-widest uppercase py-4 pl-4 md:pl-6">Ref_ID</TableHead>
                          <TableHead className="text-cyan-500/50 font-black text-[10px] tracking-widest uppercase">Content_Title</TableHead>
                          <TableHead className="text-cyan-500/50 font-black text-[10px] tracking-widest uppercase">Timestamp</TableHead>
                          <TableHead className="text-cyan-500/50 font-black text-[10px] tracking-widest uppercase text-right pr-4 md:pr-6">Operations</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {blogs?.map((blog) => (
                          <TableRow key={blog.id} className="hover:bg-cyan-500/5 border-cyan-900/20 group transition-colors">
                            <TableCell className="font-mono text-[10px] text-cyan-800 group-hover:text-cyan-600 pl-4 md:pl-6">{blog.id.slice(0, 8)}</TableCell>
                            <TableCell className="text-cyan-100 font-medium text-sm md:text-base">{blog.title}</TableCell>
                            <TableCell className="text-cyan-700 text-[10px] md:text-xs">{blog.date}</TableCell>
                            <TableCell className="text-right pr-4 md:pr-6 space-x-1 md:space-x-2">
                              <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 text-cyan-500/50 hover:text-cyan-400 hover:bg-cyan-500/10" onClick={() => handleEdit(blog, "blog")}>
                                <Edit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 text-red-900/50 hover:text-red-500 hover:bg-red-500/10" onClick={() => deleteBlogMutation.mutate(blog.id)}>
                                <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="writeups" className="mt-0 outline-none">
            <Card className="bg-black/40 border-cyan-900/30 backdrop-blur-md">
              <CardContent className="p-0 overflow-x-auto">
                {loadingWriteups ? (
                  <div className="flex justify-center p-12 md:p-20"><Loader2 className="w-8 h-8 md:w-10 md:h-10 animate-spin text-cyan-500" /></div>
                ) : (
                  <div className="min-w-[700px] md:min-w-full">
                    <Table>
                      <TableHeader className="bg-cyan-950/20">
                        <TableRow className="border-cyan-900/30 hover:bg-transparent">
                          <TableHead className="text-cyan-500/50 font-black text-[10px] tracking-widest uppercase py-4 pl-4 md:pl-6">Threat_ID</TableHead>
                          <TableHead className="text-cyan-500/50 font-black text-[10px] tracking-widest uppercase">Intel_Title</TableHead>
                          <TableHead className="text-cyan-500/50 font-black text-[10px] tracking-widest uppercase">Class</TableHead>
                          <TableHead className="text-cyan-500/50 font-black text-[10px] tracking-widest uppercase">Severity</TableHead>
                          <TableHead className="text-cyan-500/50 font-black text-[10px] tracking-widest uppercase text-right pr-4 md:pr-6">Operations</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {writeups?.map((writeup) => (
                          <TableRow key={writeup.id} className="hover:bg-cyan-500/5 border-cyan-900/20 group transition-colors">
                            <TableCell className="font-mono text-[10px] text-cyan-800 group-hover:text-cyan-600 pl-4 md:pl-6">{writeup.id.slice(0, 8)}</TableCell>
                            <TableCell className="text-cyan-100 font-medium text-sm md:text-base">{writeup.title}</TableCell>
                            <TableCell><span className="text-[9px] md:text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/5 border border-cyan-500/20 text-cyan-600">{writeup.category}</span></TableCell>
                            <TableCell>
                              <span className={`text-[9px] md:text-[10px] font-black px-2 py-0.5 rounded border uppercase ${
                                writeup.severity === "Critical" ? "text-red-500 border-red-500/50 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.2)]" :
                                writeup.severity === "High" ? "text-orange-500 border-orange-500/50 bg-orange-500/10" :
                                "text-cyan-500 border-cyan-500/50 bg-cyan-500/10"
                              }`}>
                                {writeup.severity}
                              </span>
                            </TableCell>
                            <TableCell className="text-right pr-4 md:pr-6 space-x-1 md:space-x-2">
                              <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 text-cyan-500/50 hover:text-cyan-400 hover:bg-cyan-500/10" onClick={() => handleEdit(writeup, "writeup")}>
                                <Edit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 text-red-900/50 hover:text-red-500 hover:bg-red-500/10" onClick={() => deleteWriteupMutation.mutate(writeup.id)}>
                                <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="books" className="mt-0 outline-none">
            <Card className="bg-black/40 border-cyan-900/30 backdrop-blur-md">
              <CardContent className="p-0 overflow-x-auto">
                {loadingBooks ? (
                  <div className="flex justify-center p-12 md:p-20"><Loader2 className="w-8 h-8 md:w-10 md:h-10 animate-spin text-cyan-500" /></div>
                ) : (
                  <div className="min-w-[700px] md:min-w-full">
                    <Table>
                      <TableHeader className="bg-cyan-950/20">
                        <TableRow className="border-cyan-900/30 hover:bg-transparent">
                          <TableHead className="text-cyan-500/50 font-black text-[10px] tracking-widest uppercase py-4 px-4 md:px-6">Book_ID</TableHead>
                          <TableHead className="text-cyan-500/50 font-black text-[10px] tracking-widest uppercase">Metadata</TableHead>
                          <TableHead className="text-cyan-500/50 font-black text-[10px] tracking-widest uppercase">Description</TableHead>
                          <TableHead className="text-cyan-500/50 font-black text-[10px] tracking-widest uppercase text-right pr-4 md:pr-6">Operations</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {books?.map((book) => (
                          <TableRow key={book.id} className="hover:bg-cyan-500/5 border-cyan-900/20 group transition-colors">
                            <TableCell className="font-mono text-[10px] text-cyan-800 group-hover:text-cyan-600 px-4 md:px-6">{book.id.slice(0, 8)}</TableCell>
                            <TableCell>
                              <div className="text-cyan-100 font-medium text-sm md:text-base">{book.title}</div>
                              <div className="text-[9px] md:text-[10px] text-cyan-700 uppercase tracking-tighter">By {book.author}</div>
                            </TableCell>
                            <TableCell className="max-w-xs text-[10px] md:text-xs text-cyan-100/60 line-clamp-1 py-4">{book.desc}</TableCell>
                            <TableCell className="text-right pr-4 md:pr-6 space-x-1 md:space-x-2">
                              <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 text-cyan-500/50 hover:text-cyan-400 hover:bg-cyan-500/10" onClick={() => handleEdit(book, "book")}>
                                <Edit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 md:h-8 md:w-8 text-red-900/50 hover:text-red-500 hover:bg-red-500/10" onClick={() => deleteBookMutation.mutate(book.id)}>
                                <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="about" className="mt-0 outline-none">
            <Card className="bg-black/40 border-cyan-900/30 backdrop-blur-md">
              <CardHeader className="border-b border-cyan-900/20 bg-cyan-950/10 p-4 md:p-6">
                <CardTitle className="text-xs md:text-sm font-black tracking-widest text-cyan-400 uppercase">Profile_Initialization_Protocol</CardTitle>
                <CardDescription className="text-[9px] md:text-[10px] text-cyan-700 uppercase">Modify public identity data</CardDescription>
              </CardHeader>
              <CardContent className="p-4 md:p-6">
                {loadingAbout ? (
                  <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-cyan-500" /></div>
                ) : (
                  <div className="space-y-4">
                    <Textarea 
                      value={aboutContent} 
                      onChange={(e) => setAboutContent(e.target.value)}
                      className="min-h-[250px] md:min-h-[300px] bg-black/50 border-cyan-900/50 text-cyan-100 font-mono text-xs md:text-sm leading-relaxed focus:border-cyan-500/50"
                    />
                    <Button 
                      className="w-full bg-cyan-600 hover:bg-cyan-500 text-black font-black py-6 md:py-2"
                      onClick={() => updateAboutMutation.mutate(aboutContent)}
                      disabled={updateAboutMutation.isPending}
                    >
                      {updateAboutMutation.isPending ? "UPLOADING_CHANGES..." : "OVERWRITE_PROFILE_DATA"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="mt-0 outline-none">
            <Card className="bg-black/40 border-cyan-900/30 backdrop-blur-md">
              <CardContent className="p-0 overflow-x-auto">
                {loadingMessages ? (
                  <div className="flex justify-center p-12 md:p-20"><Loader2 className="w-8 h-8 md:w-10 md:h-10 animate-spin text-cyan-500" /></div>
                ) : (
                  <div className="min-w-[800px] md:min-w-full">
                    <Table>
                      <TableHeader className="bg-cyan-950/20">
                        <TableRow className="border-cyan-900/30 hover:bg-transparent">
                          <TableHead className="text-cyan-500/50 font-black text-[10px] tracking-widest uppercase py-4 px-4 md:px-6">Sender_Intel</TableHead>
                          <TableHead className="text-cyan-500/50 font-black text-[10px] tracking-widest uppercase">Message_Payload</TableHead>
                          <TableHead className="text-cyan-500/50 font-black text-[10px] tracking-widest uppercase">Timestamp</TableHead>
                          <TableHead className="text-cyan-500/50 font-black text-[10px] tracking-widest uppercase text-right pr-4 md:pr-6">Ops</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {messages?.length === 0 ? (
                          <TableRow><TableCell colSpan={4} className="text-center py-16 md:py-20 text-cyan-900 italic uppercase tracking-tighter">No transmissions intercepted yet</TableCell></TableRow>
                        ) : (
                          messages?.map((msg) => (
                            <TableRow key={msg.id} className="hover:bg-cyan-500/5 border-cyan-900/20 transition-colors">
                              <TableCell className="py-3 md:py-4 px-4 md:px-6">
                                <div className="font-bold text-cyan-100 text-sm md:text-base">{msg.name}</div>
                                <div className="text-[9px] md:text-[10px] text-cyan-700">{msg.email}</div>
                              </TableCell>
                              <TableCell className="max-w-md">
                                <div className="text-cyan-400 text-[10px] md:text-xs font-black uppercase mb-0.5 md:mb-1">{msg.subject}</div>
                                <div className="text-cyan-100/70 text-[10px] md:text-xs line-clamp-2">{msg.message}</div>
                              </TableCell>
                              <TableCell className="text-cyan-800 text-[9px] md:text-[10px] whitespace-nowrap">
                                {new Date(msg.createdAt).toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right pr-4 md:pr-6">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 md:h-8 md:w-8 text-red-900/50 hover:text-red-500 hover:bg-red-500/10"
                                  onClick={() => deleteMessageMutation.mutate(msg.id)}
                                >
                                  <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setSelectedFile(null);
        }}>
          <DialogContent className="bg-black border border-cyan-500/50 text-cyan-500 w-[95vw] md:max-w-2xl max-h-[90vh] overflow-y-auto shadow-[0_0_50px_rgba(0,255,255,0.2)] backdrop-blur-2xl p-4 md:p-6">
            <DialogHeader className="border-b border-cyan-900/50 pb-4 mb-4">
              <DialogTitle className="text-base md:text-xl font-black tracking-[0.1em] md:tracking-[0.2em] uppercase">{editingItem ? "Modify_Entry" : "Initialize_New_Entry"}</DialogTitle>
            </DialogHeader>
            
            {activeTab === "blogs" && (
              <Form {...blogForm}>
                <form onSubmit={blogForm.handleSubmit(onBlogSubmit)} className="space-y-4 md:space-y-6">
                  <FormField control={blogForm.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel className="text-[9px] md:text-[10px] uppercase tracking-widest text-cyan-700">Entry_Title</FormLabel><FormControl><Input {...field} className="bg-black border-cyan-900 focus:border-cyan-500 text-cyan-100 h-9 md:h-10 text-xs md:text-sm" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={blogForm.control} name="excerpt" render={({ field }) => (
                    <FormItem><FormLabel className="text-[9px] md:text-[10px] uppercase tracking-widest text-cyan-700">Abstract_Summary</FormLabel><FormControl><Textarea {...field} className="bg-black border-cyan-900 focus:border-cyan-500 text-cyan-100 min-h-[80px] text-xs md:text-sm" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={blogForm.control} name="date" render={({ field }) => (
                      <FormItem><FormLabel className="text-[9px] md:text-[10px] uppercase tracking-widest text-cyan-700">Log_Date</FormLabel><FormControl><Input type="date" {...field} className="bg-black border-cyan-900 text-cyan-100 h-9 md:h-10 text-xs md:text-sm" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={blogForm.control} name="readTime" render={({ field }) => (
                      <FormItem><FormLabel className="text-[9px] md:text-[10px] uppercase tracking-widest text-cyan-700">Analysis_Time</FormLabel><FormControl><Input {...field} className="bg-black border-cyan-900 text-cyan-100 h-9 md:h-10 text-xs md:text-sm" /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={blogForm.control} name="author" render={({ field }) => (
                      <FormItem><FormLabel className="text-[9px] md:text-[10px] uppercase tracking-widest text-cyan-700">Operator</FormLabel><FormControl><Input {...field} className="bg-black border-cyan-900 text-cyan-100 h-9 md:h-10 text-xs md:text-sm" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={blogForm.control} name="image" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[9px] md:text-[10px] uppercase tracking-widest text-cyan-700">Visual_Asset</FormLabel>
                        <FormControl>
                          <Input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="bg-black border-cyan-900 text-[10px] file:bg-cyan-950 file:text-cyan-400 file:border-0 file:mr-4 file:px-4 file:py-1 cursor-pointer h-9 md:h-10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={blogForm.control} name="content" render={({ field }) => (
                    <FormItem><FormLabel className="text-[9px] md:text-[10px] uppercase tracking-widest text-cyan-700">Raw_Markdown_Buffer</FormLabel><FormControl><Textarea {...field} className="h-48 md:h-64 bg-black border-cyan-900 font-mono text-[10px] md:text-xs focus:border-cyan-500 text-cyan-100" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" className="w-full bg-cyan-600 text-black font-black uppercase tracking-widest py-6 md:py-8" disabled={createBlogMutation.isPending || updateBlogMutation.isPending || uploading}>
                    {uploading ? "Uploading_Media..." : editingItem ? "Sync_Data_To_Core" : "Commit_To_Database"}
                  </Button>
                </form>
              </Form>
            )}

            {activeTab === "writeups" && (
              <Form {...writeupForm}>
                <form onSubmit={writeupForm.handleSubmit(onWriteupSubmit)} className="space-y-4 md:space-y-6">
                  <FormField control={writeupForm.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel className="text-[9px] md:text-[10px] uppercase tracking-widest text-cyan-700">Threat_Report_Title</FormLabel><FormControl><Input {...field} className="bg-black border-cyan-900 focus:border-cyan-500 text-cyan-100 h-9 md:h-10 text-xs md:text-sm" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={writeupForm.control} name="excerpt" render={({ field }) => (
                    <FormItem><FormLabel className="text-[9px] md:text-[10px] uppercase tracking-widest text-cyan-700">Executive_Summary</FormLabel><FormControl><Textarea {...field} className="bg-black border-cyan-900 focus:border-cyan-500 text-cyan-100 min-h-[80px] text-xs md:text-sm" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField control={writeupForm.control} name="category" render={({ field }) => (
                      <FormItem><FormLabel className="text-[9px] md:text-[10px] uppercase tracking-widest text-cyan-700">Vector_Class</FormLabel><FormControl><Input {...field} className="bg-black border-cyan-900 text-cyan-100 h-9 md:h-10 text-xs md:text-sm" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={writeupForm.control} name="severity" render={({ field }) => (
                      <FormItem><FormLabel className="text-[9px] md:text-[10px] uppercase tracking-widest text-cyan-700">Threat_Level</FormLabel><FormControl><Input {...field} className="bg-black border-cyan-900 text-cyan-100 h-9 md:h-10 text-xs md:text-sm" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={writeupForm.control} name="readTime" render={({ field }) => (
                      <FormItem><FormLabel className="text-[9px] md:text-[10px] uppercase tracking-widest text-cyan-700">Analysis_Time</FormLabel><FormControl><Input {...field} className="bg-black border-cyan-900 text-cyan-100 h-9 md:h-10 text-xs md:text-sm" /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={writeupForm.control} name="author" render={({ field }) => (
                      <FormItem><FormLabel className="text-[9px] md:text-[10px] uppercase tracking-widest text-cyan-700">Investigator</FormLabel><FormControl><Input {...field} className="bg-black border-cyan-900 text-cyan-100 h-9 md:h-10 text-xs md:text-sm" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={writeupForm.control} name="image" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[9px] md:text-[10px] uppercase tracking-widest text-cyan-700">Evidence_Asset</FormLabel>
                        <FormControl>
                          <Input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="bg-black border-cyan-900 text-[10px] file:bg-cyan-950 file:text-cyan-400 file:border-0 file:mr-4 file:px-4 file:py-1 cursor-pointer h-9 md:h-10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </div>
                  <FormField control={writeupForm.control} name="content" render={({ field }) => (
                    <FormItem><FormLabel className="text-[9px] md:text-[10px] uppercase tracking-widest text-cyan-700">Full_Intel_Payload</FormLabel><FormControl><Textarea {...field} className="h-48 md:h-64 bg-black border-cyan-900 font-mono text-[10px] md:text-xs focus:border-cyan-500 text-cyan-100" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <Button type="submit" className="w-full bg-cyan-600 text-black font-black uppercase tracking-widest py-6 md:py-8" disabled={createWriteupMutation.isPending || updateWriteupMutation.isPending || uploading}>
                    {uploading ? "Uploading_Media..." : editingItem ? "Sync_Data_To_Core" : "Commit_To_Database"}
                  </Button>
                </form>
              </Form>
            )}

            {activeTab === "books" && (
              <Form {...bookForm}>
                <form onSubmit={bookForm.handleSubmit(onBookSubmit)} className="space-y-4 md:space-y-6">
                  <FormField control={bookForm.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel className="text-[9px] md:text-[10px] uppercase tracking-widest text-cyan-700">Book_Title</FormLabel><FormControl><Input {...field} className="bg-black border-cyan-900 focus:border-cyan-500 text-cyan-100 h-9 md:h-10 text-xs md:text-sm" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={bookForm.control} name="author" render={({ field }) => (
                    <FormItem><FormLabel className="text-[9px] md:text-[10px] uppercase tracking-widest text-cyan-700">Primary_Author</FormLabel><FormControl><Input {...field} className="bg-black border-cyan-900 focus:border-cyan-500 text-cyan-100 h-9 md:h-10 text-xs md:text-sm" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={bookForm.control} name="desc" render={({ field }) => (
                    <FormItem><FormLabel className="text-[9px] md:text-[10px] uppercase tracking-widest text-cyan-700">Resource_Description</FormLabel><FormControl><Textarea {...field} className="bg-black border-cyan-900 focus:border-cyan-500 text-cyan-100 min-h-[80px] text-xs md:text-sm" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField control={bookForm.control} name="link" render={({ field }) => (
                       <FormItem>
                         <FormLabel className="text-[9px] md:text-[10px] uppercase tracking-widest text-cyan-700">PDF_Asset</FormLabel>
                         <FormControl>
                           <Input type="file" accept=".pdf" onChange={(e) => setSelectedPdf(e.target.files?.[0] || null)} className="bg-black border-cyan-900 text-[10px] file:bg-cyan-950 file:text-cyan-400 file:border-0 file:mr-4 file:px-4 file:py-1 cursor-pointer h-9 md:h-10" />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )} />
                     <FormField control={bookForm.control} name="cover" render={({ field }) => (
                       <FormItem>
                         <FormLabel className="text-[9px] md:text-[10px] uppercase tracking-widest text-cyan-700">Cover_Image</FormLabel>
                         <FormControl>
                           <Input type="file" accept="image/*" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="bg-black border-cyan-900 text-[10px] file:bg-cyan-950 file:text-cyan-400 file:border-0 file:mr-4 file:px-4 file:py-1 cursor-pointer h-9 md:h-10" />
                         </FormControl>
                         <FormMessage />
                       </FormItem>
                     )} />
                   </div>
                  <Button type="submit" className="w-full bg-cyan-600 text-black font-black uppercase tracking-widest py-6 md:py-8" disabled={createBookMutation.isPending || updateBookMutation.isPending || uploading}>
                    {uploading ? "Uploading_Media..." : editingItem ? "Sync_Resource_Data" : "Add_Resource_To_Library"}
                  </Button>
                </form>
              </Form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
