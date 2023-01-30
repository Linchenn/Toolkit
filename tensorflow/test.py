import tensorflow as tf
indices = tf.constant([[[[1,1,1], [1,1,1]]]])
updates = tf.constant([[[5, 3]]])
shape = tf.constant([4, 4, 4])
scatter = tf.scatter_nd(indices, updates, shape)
print(scatter)