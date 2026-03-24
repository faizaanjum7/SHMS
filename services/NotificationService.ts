import { db } from './firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp, query, where, orderBy, onSnapshot, getDocs, writeBatch, deleteDoc } from 'firebase/firestore';
import { Notification } from '../types';

export const createNotification = async (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
  try {
    const notificationsCol = collection(db, 'notifications');
    await addDoc(notificationsCol, {
      ...notification,
      read: false,
      createdAt: new Date().toISOString(), // Using ISO string for consistency with other types
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const docRef = doc(db, 'notifications', notificationId);
    await updateDoc(docRef, { read: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
};

export const markAllNotificationsAsRead = async (recipientUid: string) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('recipientUid', '==', recipientUid),
      where('read', '==', false)
    );
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach(d => {
      batch.update(d.ref, { read: true });
    });
    await batch.commit();
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
  }
};

export const clearAllNotifications = async (recipientUid: string) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('recipientUid', '==', recipientUid)
    );
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach(d => {
      batch.delete(d.ref);
    });
    await batch.commit();
  } catch (error) {
    console.error("Error clearing all notifications:", error);
  }
};

export const subscribeToNotifications = (recipientUid: string, callback: (notifications: Notification[]) => void) => {
  const q = query(
    collection(db, 'notifications'),
    where('recipientUid', '==', recipientUid),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Notification));
    callback(notifications);
  });
};
