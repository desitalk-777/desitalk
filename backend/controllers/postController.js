const Post = require('../models/Post'); // Assuming Post model is defined
const User = require('../models/User'); // Assuming User model is defined

// Get all posts for different feeds
exports.getAllPosts = async (req, res) => {
    try {
        const { feedType } = req.query; // new, rising, hot
        let posts;

        switch (feedType) {
            case 'new':
                posts = await Post.find().sort({ createdAt: -1 }); // Latest posts
                break;
            case 'rising':
                posts = await Post.find().sort({ upvotes: -1 }); // Posts with most upvotes
                break;
            case 'hot':
                posts = await Post.find().sort({ score: -1 }); // Custom score (upvotes - downvotes)
                break;
            default:
                return res.status(400).send({ message: 'Invalid feed type' });
        }

        return res.status(200).json(posts);
    } catch (error) {
        return res.status(500).send({ message: 'Server error', error });
    }
};

// Delete a post
exports.deletePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).send({ message: 'Post not found' });
        }

        if (post.userId !== req.user.id) {
            return res.status(403).send({ message: 'Unauthorized' });
        }

        await post.remove();
        return res.status(200).send({ message: 'Post deleted successfully' });
    } catch (error) {
        return res.status(500).send({ message: 'Server error', error });
    }
};

// Report a post
exports.reportPost = async (req, res) => {
    try {
        const { postId } = req.params;
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).send({ message: 'Post not found' });
        }

        post.reports.push(req.user.id); // Assume reports is an array in Post schema
        await post.save();

        return res.status(200).send({ message: 'Post reported successfully' });
    } catch (error) {
        return res.status(500).send({ message: 'Server error', error });
    }
};
