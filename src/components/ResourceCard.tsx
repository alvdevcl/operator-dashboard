// Previous content remains the same up to handleDelete function

const handleDelete = async () => {
    try {
      setIsDeleting(true);
      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      await onDelete(resource);
      if (isMounted.current) {
        setShowDeletePopover(false);
        setIsDeleting(false);
      }
    } catch (error) {
      console.error('Failed to delete resource:', error);
      if (isMounted.current) {
        setIsDeleting(false);
      }
    }
  };