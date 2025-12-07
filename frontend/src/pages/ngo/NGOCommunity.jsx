import { useState, useEffect } from 'react';
import { authAPI } from '../../utils/api';
import { 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  Send, 
  Plus,
  Search,
  Clock,
  MessageCircle,
  User,
  Award,
  Filter,
  X
} from 'lucide-react';

// Mock data for community discussions
const mockDiscussions = [
  {
    id: 1,
    title: 'Best Practices for Environmental Safety Audits',
    content: 'I\'ve been validating incidents for 3 months now and wanted to share some best practices I\'ve learned for assessing environmental safety parameters. What factors do you prioritize when evaluating lighting conditions?',
    author: 'Sarah NGO Worker',
    authorRole: 'NGO Validator',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    upvotes: 24,
    downvotes: 2,
    commentCount: 8,
    category: 'Best Practices',
    pinned: true,
    comments: [
      {
        id: 101,
        content: 'Great question! I usually check if there are working street lights within 50 meters and assess their brightness level.',
        author: 'Mike Validator',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        upvotes: 12,
        downvotes: 0
      },
      {
        id: 102,
        content: 'Don\'t forget to consider natural lighting during day time incidents. Time of day matters a lot!',
        author: 'Lisa Chen',
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
        upvotes: 8,
        downvotes: 1
      }
    ]
  },
  {
    id: 2,
    title: 'How to Handle Conflicting Incident Reports?',
    content: 'Sometimes I receive incidents where the description doesn\'t match the severity level or the photos don\'t align with the reported location. What\'s the protocol for handling these cases?',
    author: 'John Validator',
    authorRole: 'Senior NGO',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    upvotes: 18,
    downvotes: 1,
    commentCount: 12,
    category: 'Questions',
    pinned: false,
    comments: []
  },
  {
    id: 3,
    title: 'Success Story: Community Engagement After Validation',
    content: 'After validating an incident in Zone 5, we worked with local authorities to install better street lighting. Crime rate dropped by 30% in that area! Validation really makes a difference.',
    author: 'Community Safety Team',
    authorRole: 'NGO Leader',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    upvotes: 156,
    downvotes: 3,
    commentCount: 45,
    category: 'Success Stories',
    pinned: false,
    comments: []
  },
  {
    id: 4,
    title: 'Crowding vs. Isolation: Which is More Dangerous?',
    content: 'There\'s an ongoing debate in our team. Some believe crowded areas with poor visibility are riskier, while others argue isolated areas pose greater threats. What does your data show?',
    author: 'Research Team',
    authorRole: 'Analyst',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    upvotes: 42,
    downvotes: 8,
    commentCount: 28,
    category: 'Discussion',
    pinned: false,
    comments: []
  },
  {
    id: 5,
    title: 'Monthly Challenge: Validate 50 Incidents',
    content: 'Join our monthly validation challenge! Let\'s work together to process the backlog of pending incidents. Top 3 validators get recognition badges.',
    author: 'Admin Team',
    authorRole: 'Platform Admin',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    upvotes: 89,
    downvotes: 5,
    commentCount: 67,
    category: 'Events',
    pinned: true,
    comments: []
  },
  {
    id: 6,
    title: 'Transport Access Scoring - Need Clarification',
    content: 'When assessing transport access, should we only count public transport or also include ride-sharing availability? Also, what\'s a good radius to consider?',
    author: 'New Validator',
    authorRole: 'NGO Validator',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    upvotes: 15,
    downvotes: 0,
    commentCount: 9,
    category: 'Questions',
    pinned: false,
    comments: []
  }
];

const categories = ['All', 'Best Practices', 'Questions', 'Success Stories', 'Discussion', 'Events'];
const sortOptions = ['Hot', 'New', 'Top'];

export default function NGOCommunity() {
  const [discussions, setDiscussions] = useState(mockDiscussions);
  const [filteredDiscussions, setFilteredDiscussions] = useState(mockDiscussions);
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Hot');
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [userVotes, setUserVotes] = useState({}); // {discussionId: 'up' | 'down'}

  const currentUser = authAPI.getCurrentUser();

  useEffect(() => {
    applyFilters();
  }, [searchTerm, categoryFilter, sortBy, discussions]);

  const applyFilters = () => {
    let filtered = [...discussions];

    // Category filter
    if (categoryFilter !== 'All') {
      filtered = filtered.filter(d => d.category === categoryFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(d =>
        d.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      if (a.pinned !== b.pinned) return b.pinned - a.pinned;
      
      if (sortBy === 'Hot') {
        const scoreA = a.upvotes - a.downvotes + a.commentCount * 2;
        const scoreB = b.upvotes - b.downvotes + b.commentCount * 2;
        return scoreB - scoreA;
      } else if (sortBy === 'New') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === 'Top') {
        return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
      }
      return 0;
    });

    setFilteredDiscussions(filtered);
  };

  const handleVote = (discussionId, voteType) => {
    const currentVote = userVotes[discussionId];
    
    setDiscussions(discussions.map(d => {
      if (d.id !== discussionId) return d;
      
      let newUpvotes = d.upvotes;
      let newDownvotes = d.downvotes;
      
      // Remove previous vote
      if (currentVote === 'up') newUpvotes--;
      if (currentVote === 'down') newDownvotes--;
      
      // Add new vote
      if (voteType === 'up' && currentVote !== 'up') newUpvotes++;
      if (voteType === 'down' && currentVote !== 'down') newDownvotes++;
      
      return { ...d, upvotes: newUpvotes, downvotes: newDownvotes };
    }));
    
    setUserVotes({
      ...userVotes,
      [discussionId]: currentVote === voteType ? null : voteType
    });
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedDiscussion) return;
    
    const comment = {
      id: Date.now(),
      content: newComment,
      author: currentUser.username || 'Current User',
      createdAt: new Date(),
      upvotes: 0,
      downvotes: 0
    };
    
    setDiscussions(discussions.map(d => {
      if (d.id === selectedDiscussion.id) {
        return {
          ...d,
          comments: [...(d.comments || []), comment],
          commentCount: d.commentCount + 1
        };
      }
      return d;
    }));
    
    setNewComment('');
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Best Practices': 'bg-blue-100 text-blue-800',
      'Questions': 'bg-purple-100 text-purple-800',
      'Success Stories': 'bg-green-100 text-green-800',
      'Discussion': 'bg-orange-100 text-orange-800',
      'Events': 'bg-pink-100 text-pink-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Community Discussions</h1>
          <p className="text-gray-600 mt-1">Connect with other validators and share experiences</p>
        </div>
        <button
          onClick={() => setNewPostOpen(true)}
          className="px-4 py-2 bg-white text-green-600 border-2 border-green-600 rounded-lg hover:bg-green-50 inline-flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Post
        </button>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search discussions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {sortOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Discussions List */}
      <div className="space-y-4">
        {filteredDiscussions.map(discussion => (
          <div
            key={discussion.id}
            className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start space-x-4">
                {/* Vote Section */}
                <div className="flex flex-col items-center space-y-1 min-w-[40px]">
                  <button
                    onClick={() => handleVote(discussion.id, 'up')}
                    className={`p-1 rounded hover:bg-gray-100 ${userVotes[discussion.id] === 'up' ? 'text-green-600' : 'text-gray-400'}`}
                  >
                    <ThumbsUp className="w-5 h-5" />
                  </button>
                  <span className="text-sm font-semibold text-gray-900">
                    {discussion.upvotes - discussion.downvotes}
                  </span>
                  <button
                    onClick={() => handleVote(discussion.id, 'down')}
                    className={`p-1 rounded hover:bg-gray-100 ${userVotes[discussion.id] === 'down' ? 'text-red-600' : 'text-gray-400'}`}
                  >
                    <ThumbsDown className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1">
                  {/* Title with Pinned Badge */}
                  <div className="flex items-center space-x-2 mb-2">
                    {discussion.pinned && (
                      <Award className="w-5 h-5 text-green-600" />
                    )}
                    <h3 className="text-xl font-bold text-gray-900 hover:text-green-600 cursor-pointer"
                        onClick={() => setSelectedDiscussion(discussion)}>
                      {discussion.title}
                    </h3>
                  </div>

                  {/* Category & Meta */}
                  <div className="flex items-center space-x-3 mb-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(discussion.category)}`}>
                      {discussion.category}
                    </span>
                    <span className="text-sm text-gray-500">
                      Posted by <span className="font-medium">{discussion.author}</span> • {discussion.authorRole}
                    </span>
                    <span className="text-sm text-gray-400">
                      {formatTimeAgo(discussion.createdAt)}
                    </span>
                  </div>

                  {/* Content Preview */}
                  <p className="text-gray-700 mb-4 line-clamp-2">
                    {discussion.content}
                  </p>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-4 text-sm">
                    <button
                      onClick={() => setSelectedDiscussion(discussion)}
                      className="flex items-center text-gray-600 hover:text-green-600"
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      {discussion.commentCount} Comments
                    </button>
                    <button className="flex items-center text-gray-600 hover:text-green-600">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Discussion Detail Modal */}
      {selectedDiscussion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {selectedDiscussion.pinned && (
                      <Award className="w-5 h-5 text-green-600" />
                    )}
                    <h2 className="text-2xl font-bold text-gray-900">{selectedDiscussion.title}</h2>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryColor(selectedDiscussion.category)}`}>
                      {selectedDiscussion.category}
                    </span>
                    <span className="text-sm text-gray-500">
                      <User className="w-4 h-4 inline mr-1" />
                      {selectedDiscussion.author} • {selectedDiscussion.authorRole}
                    </span>
                    <span className="text-sm text-gray-400">
                      <Clock className="w-4 h-4 inline mr-1" />
                      {formatTimeAgo(selectedDiscussion.createdAt)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDiscussion(null)}
                  className="text-gray-400 hover:text-gray-600 ml-4"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Original Post */}
            <div className="p-6 border-b border-gray-200">
              <p className="text-gray-900 text-lg leading-relaxed whitespace-pre-wrap">
                {selectedDiscussion.content}
              </p>
              <div className="flex items-center space-x-4 mt-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleVote(selectedDiscussion.id, 'up')}
                    className={`p-2 rounded hover:bg-gray-100 ${userVotes[selectedDiscussion.id] === 'up' ? 'text-green-600 bg-green-50' : 'text-gray-600'}`}
                  >
                    <ThumbsUp className="w-5 h-5" />
                  </button>
                  <span className="font-semibold text-gray-900">
                    {selectedDiscussion.upvotes - selectedDiscussion.downvotes}
                  </span>
                  <button
                    onClick={() => handleVote(selectedDiscussion.id, 'down')}
                    className={`p-2 rounded hover:bg-gray-100 ${userVotes[selectedDiscussion.id] === 'down' ? 'text-red-600 bg-red-50' : 'text-gray-600'}`}
                  >
                    <ThumbsDown className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-bold text-gray-900">
                {selectedDiscussion.commentCount} Comments
              </h3>
              
              {/* Add Comment */}
              <div className="bg-gray-50 rounded-lg p-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-gray-900"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-white text-green-600 border-2 border-green-600 rounded-lg hover:bg-green-50 disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex items-center"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Comment
                  </button>
                </div>
              </div>

              {/* Comments List */}
              <div className="space-y-4">
                {(selectedDiscussion.comments || []).map(comment => (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{comment.author}</span>
                      <span className="text-sm text-gray-400">
                        {formatTimeAgo(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-gray-700 ml-6">{comment.content}</p>
                    <div className="flex items-center space-x-2 ml-6 mt-2">
                      <button className="text-gray-600 hover:text-green-600">
                        <ThumbsUp className="w-4 h-4 inline mr-1" />
                        {comment.upvotes}
                      </button>
                      <button className="text-gray-600 hover:text-red-600">
                        <ThumbsDown className="w-4 h-4 inline mr-1" />
                        {comment.downvotes}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Post Modal */}
      {newPostOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Create New Discussion</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500">
                  {categories.slice(1).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  placeholder="Enter discussion title..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                <textarea
                  rows="6"
                  placeholder="What would you like to discuss?"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 resize-none text-gray-900"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setNewPostOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => setNewPostOpen(false)}
                className="px-4 py-2 bg-white text-green-600 border-2 border-green-600 rounded-lg hover:bg-green-50"
              >
                Post Discussion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
