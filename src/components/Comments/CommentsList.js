import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Avatar, 
  IconButton, 
  Divider,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon, Send as SendIcon } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { addComment, getRouteComments, deleteComment, updateComment } from '../../services/commentService';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

const CommentsList = ({ routeId, onCommentAdded }) => {
  const { currentUser } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState('');
  const [error, setError] = useState('');

  const fetchComments = useCallback(async () => {
    if (!routeId) return;
    
    try {
      setLoading(true);
      const fetchedComments = await getRouteComments(routeId);
      setComments(fetchedComments);
      setError('');
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Не удалось загрузить комментарии');
    } finally {
      setLoading(false);
    }
  }, [routeId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    try {
      setSubmitting(true);
      setError('');
      
      const commentData = await addComment(routeId, newComment.trim());
      
      // Оптимистично обновляем UI
      setComments(prevComments => [commentData, ...prevComments]);
      setNewComment('');
      
      // Уведомляем родительский компонент
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      setError('Не удалось добавить комментарий');
      
      // В случае ошибки обновляем список комментариев
      await fetchComments();
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = async (commentId) => {
    if (!editText.trim() || submitting) return;

    try {
      setSubmitting(true);
      setError('');
      
      const updatedComment = await updateComment(commentId, editText.trim());
      
      setComments(prevComments =>
        prevComments.map(comment =>
          comment.id === commentId ? { ...comment, text: editText.trim() } : comment
        )
      );
      
      setEditingCommentId(null);
      setEditText('');
    } catch (error) {
      console.error('Error updating comment:', error);
      setError('Не удалось обновить комментарий');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот комментарий?')) return;

    try {
      setSubmitting(true);
      setError('');
      
      await deleteComment(commentId);
      
      setComments(prevComments =>
        prevComments.filter(comment => comment.id !== commentId)
      );
      
      // Уведомляем родительский компонент
      if (onCommentAdded) {
        onCommentAdded();
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError('Не удалось удалить комментарий');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {currentUser && (
        <Box component="form" onSubmit={handleSubmitComment} sx={{ mb: 3 }}>
          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="Напишите комментарий..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={submitting}
            sx={{ mb: 1 }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={!newComment.trim() || submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : <SendIcon />}
          >
            Отправить
          </Button>
        </Box>
      )}

      <List>
        {comments.map((comment, index) => (
          <React.Fragment key={comment.id}>
            <ListItem
              alignItems="flex-start"
              secondaryAction={
                currentUser?.uid === comment.userId && (
                  <Box>
                    <IconButton
                      edge="end"
                      onClick={() => {
                        setEditingCommentId(comment.id);
                        setEditText(comment.text);
                      }}
                      disabled={submitting}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      edge="end"
                      onClick={() => handleDeleteComment(comment.id)}
                      disabled={submitting}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                )
              }
            >
              <ListItemAvatar>
                <Avatar src={comment.userPhotoURL} alt={comment.userName}>
                  {comment.userName?.[0]}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography component="div" variant="subtitle2">
                    {comment.userName}
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{ ml: 1, color: 'text.secondary' }}
                    >
                      {formatDistanceToNow(
                        comment.createdAt instanceof Date
                          ? comment.createdAt
                          : new Date(comment.createdAt),
                        { addSuffix: true, locale: ru }
                      )}
                    </Typography>
                  </Typography>
                }
                secondary={
                  editingCommentId === comment.id ? (
                    <Box sx={{ mt: 1 }}>
                      <TextField
                        fullWidth
                        multiline
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        disabled={submitting}
                        sx={{ mb: 1 }}
                      />
                      <Button
                        onClick={() => handleEditComment(comment.id)}
                        disabled={!editText.trim() || submitting}
                        variant="contained"
                        size="small"
                        sx={{ mr: 1 }}
                      >
                        Сохранить
                      </Button>
                      <Button
                        onClick={() => {
                          setEditingCommentId(null);
                          setEditText('');
                        }}
                        disabled={submitting}
                        size="small"
                      >
                        Отмена
                      </Button>
                    </Box>
                  ) : (
                    <Typography
                      component="div"
                      variant="body2"
                      sx={{ whiteSpace: 'pre-wrap' }}
                    >
                      {comment.text}
                    </Typography>
                  )
                }
              />
            </ListItem>
            {index < comments.length - 1 && <Divider variant="inset" component="li" />}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

export default CommentsList; 