{/* Payment History Tab */}
            <TabsContent value="payments">
              <PaymentHistory />
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Task Form Modal */}
        <AnimatePresence>
          {showTaskForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
              >
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
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}