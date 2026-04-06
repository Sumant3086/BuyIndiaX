const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { auth } = require('../middleware/auth');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Initialize Gemini AI
const genAI = process.env.GOOGLE_API_KEY 
  ? new GoogleGenerativeAI(process.env.GOOGLE_API_KEY)
  : null;

// System context for the AI
const SYSTEM_CONTEXT = `You are a helpful e-commerce shopping assistant for an online store. 
You help customers with:
- Product recommendations
- Order tracking
- Product information
- Shopping assistance
- General queries about the store

Be friendly, professional, and concise. If you don't know something, be honest about it.
Always try to be helpful and guide customers to the right products or information.`;

// Chat with AI
router.post('/chat', auth, async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!genAI) {
      return res.status(503).json({ 
        message: 'AI service is not configured. Please set GOOGLE_API_KEY in environment variables.' 
      });
    }

    // Get user context
    const userOrders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('_id status totalAmount createdAt');

    const userContext = `
User Information:
- Name: ${req.user.name}
- Email: ${req.user.email}
- Membership Tier: ${req.user.membershipTier}
- Loyalty Points: ${req.user.loyaltyPoints}
- Recent Orders: ${userOrders.length} orders
${userOrders.length > 0 ? `- Last Order: ${userOrders[0].status} (₹${userOrders[0].totalAmount})` : ''}
`;

    // Check if message is about products
    const productKeywords = ['product', 'buy', 'purchase', 'recommend', 'looking for', 'need', 'want'];
    const isProductQuery = productKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );

    let productContext = '';
    if (isProductQuery) {
      // Get some popular products
      const products = await Product.find({ stock: { $gt: 0 } })
        .sort({ rating: -1, views: -1 })
        .limit(5)
        .select('name price category rating');

      productContext = `
Available Products (Top 5):
${products.map(p => `- ${p.name} (${p.category}) - ₹${p.price.toLocaleString()} - Rating: ${p.rating}/5`).join('\n')}
`;
    }

    // Check if message is about orders
    const orderKeywords = ['order', 'track', 'delivery', 'shipped', 'status'];
    const isOrderQuery = orderKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );

    let orderContext = '';
    if (isOrderQuery && userOrders.length > 0) {
      orderContext = `
Recent Orders:
${userOrders.map(o => `- Order #${o._id.toString().slice(-6)}: ${o.status} - ₹${o.totalAmount.toLocaleString()}`).join('\n')}
`;
    }

    // Build conversation history
    const history = conversationHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Initialize model
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Create chat session
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: SYSTEM_CONTEXT + userContext + productContext + orderContext }]
        },
        {
          role: 'model',
          parts: [{ text: 'I understand. I\'m here to help you with your shopping needs. How can I assist you today?' }]
        },
        ...history
      ],
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      },
    });

    // Send message and get response
    const result = await chat.sendMessage(message);
    const response = result.response;
    const aiMessage = response.text();

    res.json({
      message: aiMessage,
      conversationId: req.user._id.toString()
    });

  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ 
      message: 'Sorry, I encountered an error. Please try again.',
      error: error.message 
    });
  }
});

// Get product recommendations using AI
router.post('/recommend', auth, async (req, res) => {
  try {
    const { preferences, budget, category } = req.body;

    if (!genAI) {
      return res.status(503).json({ 
        message: 'AI service is not configured.' 
      });
    }

    // Get products based on criteria
    const query = {};
    if (category) query.category = category;
    if (budget) query.price = { $lte: budget };

    const products = await Product.find(query)
      .sort({ rating: -1, views: -1 })
      .limit(20)
      .select('name description price category rating numReviews');

    const productList = products.map(p => 
      `${p.name} - ${p.category} - ₹${p.price.toLocaleString()} - Rating: ${p.rating}/5 (${p.numReviews} reviews)`
    ).join('\n');

    const prompt = `Based on these products and user preferences, recommend the top 5 products:

User Preferences: ${preferences || 'General shopping'}
Budget: ${budget ? `₹${budget.toLocaleString()}` : 'No limit'}
Category: ${category || 'Any'}

Available Products:
${productList}

Please provide:
1. Top 5 product recommendations with reasons
2. Brief explanation for each recommendation
3. Any additional shopping tips

Format as a friendly, helpful response.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const recommendations = response.text();

    res.json({
      recommendations,
      products: products.slice(0, 5)
    });

  } catch (error) {
    console.error('AI Recommendation Error:', error);
    res.status(500).json({ 
      message: 'Failed to generate recommendations',
      error: error.message 
    });
  }
});

// Smart search with AI
router.post('/smart-search', async (req, res) => {
  try {
    const { query } = req.body;

    if (!genAI) {
      return res.status(503).json({ 
        message: 'AI service is not configured.' 
      });
    }

    // Get all products
    const products = await Product.find({ stock: { $gt: 0 } })
      .select('name description category tags price')
      .limit(50);

    const productList = products.map(p => 
      `${p.name} - ${p.category} - ${p.description.substring(0, 100)}`
    ).join('\n');

    const prompt = `User is searching for: "${query}"

Available products:
${productList}

Based on the search query, identify:
1. The most relevant product categories
2. Suggested search terms
3. Related products the user might be interested in

Respond in JSON format:
{
  "categories": ["category1", "category2"],
  "suggestions": ["suggestion1", "suggestion2"],
  "intent": "what the user is looking for"
}`;

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const aiResponse = response.text();

    // Try to parse JSON from response
    let parsedResponse;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      parsedResponse = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch (e) {
      parsedResponse = { suggestions: [query] };
    }

    res.json(parsedResponse);

  } catch (error) {
    console.error('Smart Search Error:', error);
    res.status(500).json({ 
      message: 'Search failed',
      error: error.message 
    });
  }
});

module.exports = router;
