sion | null };
  const { notifyTasksUpdated } = useTaskUpdates();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [weekSummary, setWeekSummary] = useState<WeekSummary>({
    totalHours: 0,
    approvedHours: 0,
    totalPayout: 0,
    approvedPayout: 0,
  });
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [selectedJiraTask, setSelectedJiraTask] = useState<JiraTask | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [taskPage, setTaskPage] = useState(1);
  const [tasksPerPage] = useState(5);
  const [taskPagination, setTaskPagination] = useState({
    currentPage: 1,
    pageSize: 5,
    total: 0,
    totalPages: 1,
    hasMore: false
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async (page = taskPage) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tasks?page=${page}&pageSize=${tasksPerPage}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
        setWeekSummary(data.summary);
        setTaskPagination(data.pagination);
        
        notifyTasksUpdated();
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePreviousPage = () => {
    if (taskPage > 1) {
      const newPage = taskPage - 1;
      setTaskPage(newPage);
      fetchTasks(newPage);
    }
  };
  
  const handleNextPage = () => {
    if (taskPagination.hasMore) {
      const newPage = taskPage + 1;
      setTaskPage(newPage);
      fetchTasks(newPage);
    }
  };

  const handleTaskSubmitted = () => {
    setShowTaskForm(false);
    setSelectedJiraTask(null);
    setTaskToEdit(null);
    fetchTasks();
  };
  
  const handleEditTask = (task: Task) => {
    setTaskToEdit(task);
    setShowTaskForm(true);
  };
  
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchTasks();
        notifyTasksUpdated();
      } else {
        alert('Failed to delete task. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('An error occurred while deleting the task.');
    }
  };
  
  const handleJiraTaskSelected = (task: JiraTask) => {
    setSelectedJiraTask(task);
    setShowTaskForm(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      default:
        return 'status-pending';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div 
          className="flex flex-col items-center space-y-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <motion.div 
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <h1 className="text-4xl font-bold gradient-text">Developer Dashboard</h1>
            <p className="text-muted-foreground mt-2">Track your progress and manage your tasks</p>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              onClick={() => setShowTaskForm(true)} 
              className="btn-primary"
            >
              <Plus className="mr-2 h-4 w-4" /> 
              Add Task
            </Button>
          </motion.div>
        </motion.div>
        
        {/* Week Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <WeekOverview />
        </motion.div>

        {/* Summary Cards */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <motion.div
            className="glass-card hover-lift rounded-xl p-6"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Hours</p>
                <p className="text-3xl font-bold text-foreground mt-2">{weekSummary.totalHours}</p>
                <p className="text-xs text-muted-foreground mt-1">This week</p>
              </div>
              <div className="p-3 bg-gradient-primary rounded-xl">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            className="glass-card hover-lift rounded-xl p-6"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved Hours</p>
                <p className="text-3xl font-bold text-foreground mt-2">{weekSummary.approvedHours}</p>
                <p className="text-xs text-muted-foreground mt-1">Ready for payment</p>
              </div>
              <div className="p-3 bg-gradient-secondary rounded-xl">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            className="glass-card hover-lift rounded-xl p-6"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Earnings</p>
                <p className="text-3xl font-bold text-foreground mt-2">{formatCurrency(weekSummary.totalPayout)}</p>
                <p className="text-xs text-muted-foreground mt-1">Potential</p>
              </div>
              <div className="p-3 bg-gradient-accent rounded-xl">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </motion.div>

          <motion.div
            className="glass-card hover-lift rounded-xl p-6"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Confirmed</p>
                <p className="text-3xl font-bold text-foreground mt-2">{formatCurrency(weekSummary.approvedPayout)}</p>
                <p className="text-xs text-muted-foreground mt-1">Approved earnings</p>
              </div>
              <div className="p-3 bg-green-500 rounded-xl">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Tabs Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Tabs defaultValue="tasks" className="space-y-6">
            <TabsList className="glass-card p-1 rounded-xl">
              <TabsTrigger value="tasks" className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-white">
                <ListChecks className="h-4 w-4" />
                My Tasks
              </TabsTrigger>
              <TabsTrigger value="jira" className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-white">
                <Link className="h-4 w-4" />
                Jira Integration
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-2 data-[state=active]:bg-gradient-primary data-[state=active]:text-white">
                <FileText className="h-4 w-4" />
                Payment History
              </TabsTrigger>
            </TabsList>

            {/* My Tasks Tab */}
            <TabsContent value="tasks">
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    My Tasks
                  </CardTitle>
                  <CardDescription>All tasks submitted this week</CardDescription>
                </CardHeader>
                <CardContent>
                  {tasks.length === 0 ? (
                    <motion.div 
                      className="text-center py-12"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                        <Zap className="h-8 w-8 text-white" />
                      </div>
                      <p className="text-lg font-medium text-foreground mb-2">No tasks yet</p>
                      <p className="text-muted-foreground mb-4">Click "Add Task" to get started with your first task.</p>
                      <Button onClick={() => setShowTaskForm(true)} className="btn-primary">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Your First Task
                      </Button>
                    </motion.div>
                  ) : (
                    <div className="space-y-4">
                      <AnimatePresence>
                        {tasks.map((task, index) => (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.1 }}
                            className="glass-card hover-lift rounded-xl p-6"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-3">
                                  {getStatusIcon(task.status)}
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(task.status)}`}>
                                    {task.status}
                                  </span>
                                  {task.jiraTaskKey && (
                                    <span className="bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-medium">
                                      {task.jiraTaskKey}
                                    </span>
                                  )}
                                </div>
                                <h3 className="font-semibold text-foreground mb-2">{task.description}</h3>
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {task.hours} hours
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="h-4 w-4" />
                                    {formatCurrency(Number(task.hours) * Number(session?.user?.hourlyRate || 0))}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {new Date(task.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                {task.adminComment && (
                                  <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                    <p className="text-sm text-yellow-400">
                                      <strong>Admin feedback:</strong> {task.adminComment}
                                    </p>
                                  </div>
                                )}
                              </div>
                              {task.status === 'pending' && (
                                <div className="flex space-x-2 ml-4">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="hover:bg-blue-500/10 hover:text-blue-400"
                                    onClick={() => handleEditTask(task)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="hover:bg-red-500/10 hover:text-red-400"
                                    onClick={() => handleDeleteTask(task.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      
                      {/* Pagination */}
                      {taskPagination.total > 0 && (
                        <div className="flex items-center justify-between pt-4">
                          <p className="text-sm text-muted-foreground">
                            Showing {tasks.length > 0 ? (taskPage - 1) * tasksPerPage + 1 : 0} to{' '}
                            {Math.min(taskPage * tasksPerPage, taskPagination.total)} of {taskPagination.total} tasks
                          </p>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={taskPage <= 1}
                              onClick={handlePreviousPage}
                              className="glass-card border-white/10"
                            >
                              Previous
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!taskPagination.hasMore}
                              onClick={handleNextPage}
                              className="glass-card border-white/10"
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Jira Integration Tab */}
            <TabsContent value="jira">
              <Card className="glass-card border-0">
                <CardContent className="pt-6">
                  <JiraSection 
                    onConnect={() => fetchTasks()} 
                    onSelectTaskForTimesheet={handleJiraTaskSelected} 
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payment History Tab */}
            <TabsContent value="payments">
              <PaymentHistory />
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Task Form Modal */}
        <AnimatePresence>
          {showTaskForm && (
            <TaskForm
              onClose={() => {
                setShowTaskForm(false);
                setSelectedJiraTask(null);
                setTaskToEdit(null);
              }}
              onSubmit={handleTaskSubmitted}
              selectedJiraTask={selectedJiraTask}
              taskToEdit={taskToEdit}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}