import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { createClient } from "npm:@supabase/supabase-js";
import { create as createJWT, verify as verifyJWT } from "https://deno.land/x/djwt@v3.0.1/mod.ts";

const app = new Hono();

// JWT Secret - create a CryptoKey for signing
const getJWTKey = async () => {
  const secret = Deno.env.get("JWT_SECRET") || "ai-school-secret-key-change-in-production";
  const keyData = new TextEncoder().encode(secret);
  return await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    true,
    ["sign", "verify"]
  );
};

let JWT_SECRET: CryptoKey;

// Initialize JWT key
getJWTKey().then(key => {
  JWT_SECRET = key;
});

// Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Password hashing utilities using Web Crypto API
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const passwordData = encoder.encode(password);
  
  const key = await crypto.subtle.importKey(
    "raw",
    passwordData,
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    key,
    256
  );
  
  const hashArray = new Uint8Array(hashBuffer);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);
  
  // Convert to base64
  return btoa(String.fromCharCode(...combined));
};

const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  try {
    const encoder = new TextEncoder();
    const combined = Uint8Array.from(atob(hashedPassword), c => c.charCodeAt(0));
    
    const salt = combined.slice(0, 16);
    const hash = combined.slice(16);
    
    const passwordData = encoder.encode(password);
    const key = await crypto.subtle.importKey(
      "raw",
      passwordData,
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );
    
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      key,
      256
    );
    
    const newHash = new Uint8Array(hashBuffer);
    
    // Compare hashes
    if (hash.length !== newHash.length) return false;
    
    for (let i = 0; i < hash.length; i++) {
      if (hash[i] !== newHash[i]) return false;
    }
    
    return true;
  } catch {
    return false;
  }
};

// Enable logger
app.use('*', logger(console.log));

// Enable CORS
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check
app.get("/make-server-9bf00556/health", (c) => {
  return c.json({ status: "ok" });
});

// Initialize database with sample data
app.post("/make-server-9bf00556/init-data", async (c) => {
  try {
    const existingCourses = await kv.getByPrefix("course:");
    if (existingCourses.length > 0) {
      return c.json({ message: "Data already initialized" });
    }

    // Create courses
    const courses = [
      {
        id: "marketing",
        title: "AI for Marketing",
        description: "Master AI tools and techniques to revolutionize your marketing strategies",
        icon: "megaphone",
        color: "purple"
      },
      {
        id: "designers",
        title: "AI for Designers",
        description: "Learn how to leverage AI to enhance your creative design workflow",
        icon: "palette",
        color: "pink"
      },
      {
        id: "devs",
        title: "AI for Developers",
        description: "Build intelligent applications with cutting-edge AI technologies",
        icon: "code",
        color: "blue"
      },
      {
        id: "creators",
        title: "AI for Content Creators",
        description: "Transform your content creation with powerful AI assistance",
        icon: "video",
        color: "green"
      }
    ];

    // Create sample tasks for each course
    const tasksData = [
      // AI for Marketing
      {
        id: "marketing-1",
        course_id: "marketing",
        sequence_order: 1,
        title: "AI Marketing Fundamentals",
        description: "Understanding AI's role in modern marketing",
        instructional_content: `# AI Marketing Fundamentals

## Introduction to AI in Marketing

AI is transforming how marketers connect with customers, analyze data, and optimize campaigns.

## Key Applications

### Customer Segmentation
- Predictive analytics for targeting
- Behavioral clustering
- Personalization at scale

### Content Marketing
- AI-powered content generation
- SEO optimization
- A/B testing automation

### Campaign Optimization
- Real-time bidding
- Budget allocation
- Performance prediction

## Popular AI Marketing Tools

- ChatGPT: Content creation
- Jasper: Marketing copy
- Surfer SEO: Content optimization
- Adext: Ad optimization

Ready to test your knowledge?`,
        passing_score: 70
      },
      {
        id: "marketing-2",
        course_id: "marketing",
        sequence_order: 2,
        title: "Predictive Analytics for Marketing",
        description: "Using AI to forecast customer behavior",
        instructional_content: `# Predictive Analytics for Marketing

## What is Predictive Analytics?

Using historical data and AI to predict future customer actions.

## Applications

### Customer Lifetime Value (CLV)
Predict long-term customer value

### Churn Prediction
Identify customers likely to leave

### Lead Scoring
Rank prospects by conversion probability

## Implementation

1. Data collection
2. Feature engineering
3. Model training
4. Deployment
5. Monitoring

Test your understanding!`,
        passing_score: 70
      },

      // AI for Designers
      {
        id: "designers-1",
        course_id: "designers",
        sequence_order: 1,
        title: "AI Design Tools Overview",
        description: "Exploring AI-powered design platforms",
        instructional_content: `# AI Design Tools Overview

## The AI Design Revolution

AI is augmenting designers' capabilities, not replacing them.

## Popular AI Design Tools

### Image Generation
- Midjourney: High-quality art
- DALL-E: Versatile image creation
- Stable Diffusion: Open-source power

### Design Assistance
- Adobe Firefly: Creative suite integration
- Canva AI: Template enhancement
- Figma AI: Design automation

### 3D & Motion
- Runway ML: Video editing
- Spline AI: 3D generation

## Best Practices

- Use AI for iteration
- Maintain creative control
- Combine AI with human insight

Take the quiz!`,
        passing_score: 70
      },
      {
        id: "designers-2",
        course_id: "designers",
        sequence_order: 2,
        title: "Prompt Engineering for Designers",
        description: "Mastering AI image generation prompts",
        instructional_content: `# Prompt Engineering for Designers

## Crafting Effective Prompts

The key to great AI-generated designs.

## Prompt Structure

1. **Subject**: What you want
2. **Style**: Artistic direction
3. **Details**: Specific attributes
4. **Quality**: Technical specs

## Examples

### Basic
"A logo for a tech startup"

### Advanced
"Minimalist geometric logo for AI tech startup, blue and white, clean lines, modern sans-serif, vector, professional"

## Tips

- Be specific
- Use art terms
- Iterate and refine
- Study successful prompts

Test your skills!`,
        passing_score: 70
      },

      // AI for Developers
      {
        id: "devs-1",
        course_id: "devs",
        sequence_order: 1,
        title: "Introduction to AI Development",
        description: "Building your first AI application",
        instructional_content: `# Introduction to AI Development

## Getting Started with AI Development

Learn to integrate AI into your applications.

## Core Concepts

### APIs vs. Models
- **APIs**: Easy integration (OpenAI, Claude)
- **Models**: Full control (TensorFlow, PyTorch)

### Common Use Cases
- Chatbots
- Recommendation systems
- Image recognition
- Natural language processing

## Your First AI App

\`\`\`python
import openai

response = openai.ChatCompletion.create(
  model="gpt-4",
  messages=[{"role": "user", "content": "Hello!"}]
)

print(response.choices[0].message.content)
\`\`\`

## Best Practices

- Handle errors gracefully
- Implement rate limiting
- Monitor costs
- Validate inputs

Ready for the quiz?`,
        passing_score: 70
      },
      {
        id: "devs-2",
        course_id: "devs",
        sequence_order: 2,
        title: "Fine-tuning AI Models",
        description: "Customizing AI for your specific needs",
        instructional_content: `# Fine-tuning AI Models

## What is Fine-tuning?

Adapting pre-trained models to your specific use case.

## When to Fine-tune

- Domain-specific language
- Custom classification tasks
- Improved accuracy on your data

## Process

1. **Prepare dataset**: Clean, labeled data
2. **Choose base model**: Start with pre-trained
3. **Train**: Adjust parameters
4. **Evaluate**: Test performance
5. **Deploy**: Production ready

## Tools

- Hugging Face Transformers
- OpenAI Fine-tuning API
- Google Vertex AI

## Cost Considerations

Balance between:
- Training cost
- Inference speed
- Accuracy requirements

Test your knowledge!`,
        passing_score: 70
      },

      // AI for Content Creators
      {
        id: "creators-1",
        course_id: "creators",
        sequence_order: 1,
        title: "AI Content Generation Basics",
        description: "Creating engaging content with AI",
        instructional_content: `# AI Content Generation Basics

## AI as Your Creative Assistant

Enhance your content creation workflow with AI.

## Content Types

### Written Content
- Blog posts
- Social media captions
- Scripts
- Email newsletters

### Visual Content
- Thumbnails
- Graphics
- Illustrations

### Video Content
- AI video editing
- Automated captions
- Voice cloning

## Popular Tools

- ChatGPT: Writing assistant
- Copy.ai: Marketing copy
- Descript: Audio/video editing
- ElevenLabs: Voice synthesis

## Best Practices

- Add your unique voice
- Fact-check AI output
- Edit and refine
- Maintain authenticity

Start the quiz!`,
        passing_score: 70
      },
      {
        id: "creators-2",
        course_id: "creators",
        sequence_order: 2,
        title: "AI Video Production",
        description: "Revolutionizing video creation with AI",
        instructional_content: `# AI Video Production

## The Future of Video Creation

AI is making professional video production accessible to everyone.

## AI Video Tools

### Editing
- Runway ML: Advanced editing
- Descript: Text-based editing
- Adobe Premiere Pro AI: Smart tools

### Generation
- Synthesia: AI avatars
- D-ID: Talking heads
- Pictory: Text to video

## Workflow

1. Script with AI
2. Generate visuals
3. AI voice-over
4. Automated editing
5. Caption generation

## Tips

- Start with strong scripting
- Use AI for repetitive tasks
- Keep human creativity central
- Test different tools

Take the quiz!`,
        passing_score: 70
      }
    ];

    // Create questions for each task
    const questionsData = [
      // Marketing Course Questions
      {
        id: "q_marketing_1_1",
        task_id: "marketing-1",
        question_text: "What is a key benefit of AI in customer segmentation?",
        options: {
          a: "Manual data entry",
          b: "Behavioral clustering and personalization at scale",
          c: "Reduced marketing budget",
          d: "Elimination of human marketers"
        },
        correct_answer: "b"
      },
      {
        id: "q_marketing_1_2",
        task_id: "marketing-1",
        question_text: "Which AI tool is specifically mentioned for content creation?",
        options: {
          a: "Photoshop",
          b: "Excel",
          c: "ChatGPT",
          d: "PowerPoint"
        },
        correct_answer: "c"
      },
      {
        id: "q_marketing_1_3",
        task_id: "marketing-1",
        question_text: "AI can optimize marketing campaigns in real-time.",
        options: {
          a: "True",
          b: "False"
        },
        correct_answer: "a"
      },
      {
        id: "q_marketing_1_4",
        task_id: "marketing-1",
        question_text: "What is Surfer SEO used for?",
        options: {
          a: "Video editing",
          b: "Content optimization",
          c: "Email marketing",
          d: "Social media scheduling"
        },
        correct_answer: "b"
      },
      {
        id: "q_marketing_1_5",
        task_id: "marketing-1",
        question_text: "Which application involves AI-powered A/B testing?",
        options: {
          a: "Customer Segmentation",
          b: "Content Marketing",
          c: "Campaign Optimization",
          d: "Email Design"
        },
        correct_answer: "b"
      },

      {
        id: "q_marketing_2_1",
        task_id: "marketing-2",
        question_text: "What does CLV stand for?",
        options: {
          a: "Customer Lifetime Value",
          b: "Customer Lead Verification",
          c: "Cost Level Variable",
          d: "Creative Lead Vision"
        },
        correct_answer: "a"
      },
      {
        id: "q_marketing_2_2",
        task_id: "marketing-2",
        question_text: "Churn prediction helps identify:",
        options: {
          a: "New customers",
          b: "Customers likely to leave",
          c: "Best products",
          d: "Market trends"
        },
        correct_answer: "b"
      },
      {
        id: "q_marketing_2_3",
        task_id: "marketing-2",
        question_text: "Lead scoring ranks prospects by:",
        options: {
          a: "Age",
          b: "Location",
          c: "Conversion probability",
          d: "Company size"
        },
        correct_answer: "c"
      },
      {
        id: "q_marketing_2_4",
        task_id: "marketing-2",
        question_text: "Predictive analytics uses historical data.",
        options: {
          a: "True",
          b: "False"
        },
        correct_answer: "a"
      },
      {
        id: "q_marketing_2_5",
        task_id: "marketing-2",
        question_text: "What is the first step in implementing predictive analytics?",
        options: {
          a: "Monitoring",
          b: "Data collection",
          c: "Deployment",
          d: "Model training"
        },
        correct_answer: "b"
      },

      // Designer Course Questions
      {
        id: "q_designers_1_1",
        task_id: "designers-1",
        question_text: "AI in design is meant to:",
        options: {
          a: "Replace designers",
          b: "Augment designers' capabilities",
          c: "Eliminate creativity",
          d: "Reduce quality"
        },
        correct_answer: "b"
      },
      {
        id: "q_designers_1_2",
        task_id: "designers-1",
        question_text: "Which tool is known for high-quality art generation?",
        options: {
          a: "Microsoft Word",
          b: "Midjourney",
          c: "Excel",
          d: "Outlook"
        },
        correct_answer: "b"
      },
      {
        id: "q_designers_1_3",
        task_id: "designers-1",
        question_text: "Adobe Firefly integrates with the Creative Suite.",
        options: {
          a: "True",
          b: "False"
        },
        correct_answer: "a"
      },
      {
        id: "q_designers_1_4",
        task_id: "designers-1",
        question_text: "What is Runway ML used for?",
        options: {
          a: "3D modeling",
          b: "Video editing",
          c: "Audio editing",
          d: "Code generation"
        },
        correct_answer: "b"
      },
      {
        id: "q_designers_1_5",
        task_id: "designers-1",
        question_text: "A best practice is to:",
        options: {
          a: "Let AI make all decisions",
          b: "Avoid AI completely",
          c: "Maintain creative control",
          d: "Copy other designers"
        },
        correct_answer: "c"
      },

      {
        id: "q_designers_2_1",
        task_id: "designers-2",
        question_text: "What is the first element of a good prompt structure?",
        options: {
          a: "Quality",
          b: "Subject",
          c: "Style",
          d: "Details"
        },
        correct_answer: "b"
      },
      {
        id: "q_designers_2_2",
        task_id: "designers-2",
        question_text: "Which prompt is more effective?",
        options: {
          a: "A logo",
          b: "Minimalist geometric logo for AI tech startup, blue and white",
          c: "Logo design",
          d: "Make a picture"
        },
        correct_answer: "b"
      },
      {
        id: "q_designers_2_3",
        task_id: "designers-2",
        question_text: "Being specific in prompts improves results.",
        options: {
          a: "True",
          b: "False"
        },
        correct_answer: "a"
      },
      {
        id: "q_designers_2_4",
        task_id: "designers-2",
        question_text: "What should you do with AI-generated results?",
        options: {
          a: "Use them as-is",
          b: "Delete them",
          c: "Iterate and refine",
          d: "Ignore them"
        },
        correct_answer: "c"
      },
      {
        id: "q_designers_2_5",
        task_id: "designers-2",
        question_text: "Studying successful prompts is recommended.",
        options: {
          a: "True",
          b: "False"
        },
        correct_answer: "a"
      },

      // Developer Course Questions
      {
        id: "q_devs_1_1",
        task_id: "devs-1",
        question_text: "What's the difference between APIs and Models?",
        options: {
          a: "No difference",
          b: "APIs offer easy integration, Models offer full control",
          c: "Models are always free",
          d: "APIs don't work"
        },
        correct_answer: "b"
      },
      {
        id: "q_devs_1_2",
        task_id: "devs-1",
        question_text: "Which is NOT mentioned as a common AI use case?",
        options: {
          a: "Chatbots",
          b: "Recommendation systems",
          c: "Cooking recipes",
          d: "Image recognition"
        },
        correct_answer: "c"
      },
      {
        id: "q_devs_1_3",
        task_id: "devs-1",
        question_text: "Rate limiting is a best practice.",
        options: {
          a: "True",
          b: "False"
        },
        correct_answer: "a"
      },
      {
        id: "q_devs_1_4",
        task_id: "devs-1",
        question_text: "What library is shown in the Python example?",
        options: {
          a: "tensorflow",
          b: "openai",
          c: "pandas",
          d: "numpy"
        },
        correct_answer: "b"
      },
      {
        id: "q_devs_1_5",
        task_id: "devs-1",
        question_text: "Monitoring costs is important when using AI APIs.",
        options: {
          a: "True",
          b: "False"
        },
        correct_answer: "a"
      },

      {
        id: "q_devs_2_1",
        task_id: "devs-2",
        question_text: "What is fine-tuning?",
        options: {
          a: "Building a model from scratch",
          b: "Adapting pre-trained models to specific use cases",
          c: "Deleting a model",
          d: "Copying someone else's model"
        },
        correct_answer: "b"
      },
      {
        id: "q_devs_2_2",
        task_id: "devs-2",
        question_text: "When should you fine-tune a model?",
        options: {
          a: "Never",
          b: "Always",
          c: "For domain-specific language or custom tasks",
          d: "Only on Tuesdays"
        },
        correct_answer: "c"
      },
      {
        id: "q_devs_2_3",
        task_id: "devs-2",
        question_text: "What is the first step in fine-tuning?",
        options: {
          a: "Deploy",
          b: "Prepare dataset",
          c: "Evaluate",
          d: "Train"
        },
        correct_answer: "b"
      },
      {
        id: "q_devs_2_4",
        task_id: "devs-2",
        question_text: "Hugging Face Transformers is a fine-tuning tool.",
        options: {
          a: "True",
          b: "False"
        },
        correct_answer: "a"
      },
      {
        id: "q_devs_2_5",
        task_id: "devs-2",
        question_text: "Fine-tuning requires balancing:",
        options: {
          a: "Only cost",
          b: "Training cost, inference speed, and accuracy",
          c: "Only speed",
          d: "Nothing"
        },
        correct_answer: "b"
      },

      // Content Creator Course Questions
      {
        id: "q_creators_1_1",
        task_id: "creators-1",
        question_text: "How should AI be viewed in content creation?",
        options: {
          a: "As a replacement",
          b: "As a creative assistant",
          c: "As unnecessary",
          d: "As too expensive"
        },
        correct_answer: "b"
      },
      {
        id: "q_creators_1_2",
        task_id: "creators-1",
        question_text: "What is ElevenLabs used for?",
        options: {
          a: "Image generation",
          b: "Voice synthesis",
          c: "Video editing",
          d: "Writing"
        },
        correct_answer: "b"
      },
      {
        id: "q_creators_1_3",
        task_id: "creators-1",
        question_text: "AI-generated content should be fact-checked.",
        options: {
          a: "True",
          b: "False"
        },
        correct_answer: "a"
      },
      {
        id: "q_creators_1_4",
        task_id: "creators-1",
        question_text: "Which content type can AI help create?",
        options: {
          a: "Blog posts",
          b: "Social media captions",
          c: "Email newsletters",
          d: "All of the above"
        },
        correct_answer: "d"
      },
      {
        id: "q_creators_1_5",
        task_id: "creators-1",
        question_text: "Maintaining authenticity is important when using AI.",
        options: {
          a: "True",
          b: "False"
        },
        correct_answer: "a"
      },

      {
        id: "q_creators_2_1",
        task_id: "creators-2",
        question_text: "What is Descript known for?",
        options: {
          a: "Image generation",
          b: "Text-based editing",
          c: "3D modeling",
          d: "Web design"
        },
        correct_answer: "b"
      },
      {
        id: "q_creators_2_2",
        task_id: "creators-2",
        question_text: "Which tool creates AI avatars?",
        options: {
          a: "Photoshop",
          b: "Synthesia",
          c: "Word",
          d: "Excel"
        },
        correct_answer: "b"
      },
      {
        id: "q_creators_2_3",
        task_id: "creators-2",
        question_text: "What is the first step in the AI video workflow?",
        options: {
          a: "Caption generation",
          b: "Script with AI",
          c: "Automated editing",
          d: "AI voice-over"
        },
        correct_answer: "b"
      },
      {
        id: "q_creators_2_4",
        task_id: "creators-2",
        question_text: "AI should be used for repetitive tasks.",
        options: {
          a: "True",
          b: "False"
        },
        correct_answer: "a"
      },
      {
        id: "q_creators_2_5",
        task_id: "creators-2",
        question_text: "What should remain central in AI video production?",
        options: {
          a: "Automation",
          b: "Cost reduction",
          c: "Human creativity",
          d: "Speed"
        },
        correct_answer: "c"
      }
    ];

    // Save courses
    for (const course of courses) {
      await kv.set(`course:${course.id}`, course);
    }

    // Save tasks
    for (const task of tasksData) {
      await kv.set(`task:${task.id}`, task);
    }

    // Save questions
    for (const task of tasksData) {
      const taskQuestions = questionsData.filter(q => q.task_id === task.id);
      await kv.set(`questions:${task.id}`, taskQuestions);
    }

    return c.json({ 
      message: "Sample data initialized successfully", 
      courseCount: courses.length,
      taskCount: tasksData.length 
    });
  } catch (error) {
    console.error("Error initializing data:", error);
    return c.json({ error: "Failed to initialize data", details: error.message }, 500);
  }
});

// Sign Up
app.post("/make-server-9bf00556/auth/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name } = body;

    console.log("Signup request received for email:", email);

    if (!email || !password) {
      console.error("Missing email or password");
      return c.json({ error: "Email and password are required" }, 400);
    }

    const existingUser = await kv.get(`user:${email}`);
    if (existingUser) {
      console.error("User already exists:", email);
      return c.json({ error: "User already exists" }, 400);
    }

    console.log("Hashing password...");
    const password_hash = await hashPassword(password);
    console.log("Password hashed successfully");
    
    const userId = crypto.randomUUID();

    const user = {
      id: userId,
      email,
      password_hash,
      name: name || email.split('@')[0],
      created_at: new Date().toISOString()
    };

    console.log("Saving user to database...");
    await kv.set(`user:${email}`, user);
    await kv.set(`user_by_id:${userId}`, email);
    console.log("User saved successfully");

    // Initialize progress
    console.log("Initializing user progress...");
    const tasks = await kv.getByPrefix("task:");
    console.log("Found tasks:", tasks.length);
    
    for (const task of tasks) {
      const isFirstTask = task.sequence_order === 1;
      await kv.set(`progress:${userId}:${task.id}`, {
        user_id: userId,
        task_id: task.id,
        is_unlocked: isFirstTask,
        is_passed: false,
        highest_score: null
      });
    }
    console.log("Progress initialized successfully");

    // Generate JWT
    console.log("Generating JWT token...");
    const token = await createJWT(
      { alg: "HS256", typ: "JWT" },
      { userId, email, exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) },
      JWT_SECRET
    );
    console.log("JWT token generated successfully");

    return c.json({
      message: "User created successfully",
      token,
      user: { id: userId, email, name: user.name }
    });
  } catch (error) {
    console.error("Signup error details:", error);
    console.error("Error stack:", error.stack);
    return c.json({ 
      error: "Signup failed", 
      details: error.message,
      stack: error.stack 
    }, 500);
  }
});

// Login
app.post("/make-server-9bf00556/auth/login", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password } = body;

    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    const user = await kv.get(`user:${email}`);
    if (!user) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    const token = await createJWT(
      { alg: "HS256", typ: "JWT" },
      { userId: user.id, email, exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) },
      JWT_SECRET
    );

    return c.json({
      message: "Login successful",
      token,
      user: { id: user.id, email, name: user.name }
    });
  } catch (error) {
    console.error("Login error:", error);
    return c.json({ error: "Login failed", details: error.message }, 500);
  }
});

// Verify token
const verifyToken = async (token: string) => {
  try {
    const payload = await verifyJWT(token, JWT_SECRET);
    return payload;
  } catch (error) {
    return null;
  }
};

// Get all courses
app.get("/make-server-9bf00556/courses", async (c) => {
  try {
    console.log("Fetching courses...");
    const courses = await kv.getByPrefix("course:");
    console.log("Courses found:", courses.length);
    return c.json({ courses });
  } catch (error) {
    console.error("Error fetching courses:", error);
    console.error("Error details:", error.message, error.stack);
    return c.json({ error: "Failed to fetch courses", details: error.message }, 500);
  }
});

// Get tasks by course with progress
app.get("/make-server-9bf00556/courses/:courseId/tasks/:userId", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const token = authHeader?.split(" ")[1];
    
    if (!token) {
      console.error("Missing authorization token");
      return c.json({ error: "Authorization token required" }, 401);
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      console.error("Invalid or expired token");
      return c.json({ error: "Invalid or expired token" }, 401);
    }

    const userId = c.req.param("userId");
    const courseId = c.req.param("courseId");

    if (decoded.userId !== userId) {
      console.error("Unauthorized access attempt");
      return c.json({ error: "Unauthorized access" }, 403);
    }

    console.log(`Fetching tasks for course ${courseId}, user ${userId}`);
    const allTasks = await kv.getByPrefix("task:");
    const courseTasks = allTasks.filter(t => t.course_id === courseId);
    courseTasks.sort((a, b) => a.sequence_order - b.sequence_order);

    console.log(`Found ${courseTasks.length} tasks for course ${courseId}`);

    const tasksWithProgress = await Promise.all(
      courseTasks.map(async (task) => {
        const progress = await kv.get(`progress:${userId}:${task.id}`);
        
        // First task is always unlocked for new users
        const isFirstTask = task.sequence_order === 1;
        const isUnlocked = isFirstTask || (progress?.is_unlocked ?? false);
        
        if (progress && !isUnlocked) {
          return {
            id: task.id,
            course_id: task.course_id,
            sequence_order: task.sequence_order,
            title: task.title,
            description: null,
            instructional_content: null,
            is_unlocked: false,
            is_passed: progress.is_passed,
            highest_score: progress.highest_score,
            passing_score: task.passing_score
          };
        }

        return {
          ...task,
          is_unlocked: isUnlocked,
          is_passed: progress?.is_passed ?? false,
          highest_score: progress?.highest_score ?? null
        };
      })
    );

    return c.json({ tasks: tasksWithProgress });
  } catch (error) {
    console.error("Error fetching course tasks:", error);
    console.error("Error details:", error.message, error.stack);
    return c.json({ error: "Failed to fetch tasks", details: error.message }, 500);
  }
});

// Get tasks with progress (all tasks)
app.get("/make-server-9bf00556/tasks/:userId", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const token = authHeader?.split(" ")[1];
    
    if (!token) {
      return c.json({ error: "Authorization token required" }, 401);
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return c.json({ error: "Invalid or expired token" }, 401);
    }

    const userId = c.req.param("userId");

    if (decoded.userId !== userId) {
      return c.json({ error: "Unauthorized access" }, 403);
    }

    const tasks = await kv.getByPrefix("task:");
    tasks.sort((a, b) => a.sequence_order - b.sequence_order);

    const tasksWithProgress = await Promise.all(
      tasks.map(async (task) => {
        const progress = await kv.get(`progress:${userId}:${task.id}`);
        
        if (progress && !progress.is_unlocked) {
          return {
            id: task.id,
            sequence_order: task.sequence_order,
            title: task.title,
            description: null,
            instructional_content: null,
            is_unlocked: false,
            is_passed: progress.is_passed,
            highest_score: progress.highest_score,
            passing_score: task.passing_score
          };
        }

        return {
          ...task,
          is_unlocked: progress?.is_unlocked ?? false,
          is_passed: progress?.is_passed ?? false,
          highest_score: progress?.highest_score ?? null
        };
      })
    );

    return c.json({ tasks: tasksWithProgress });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return c.json({ error: "Failed to fetch tasks", details: error.message }, 500);
  }
});

// Get quiz
app.get("/make-server-9bf00556/task/:taskId/quiz", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const token = authHeader?.split(" ")[1];
    
    if (!token) {
      return c.json({ error: "Authorization token required" }, 401);
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return c.json({ error: "Invalid or expired token" }, 401);
    }

    const taskId = c.req.param("taskId");
    const userId = decoded.userId;

    const progress = await kv.get(`progress:${userId}:${taskId}`);
    if (!progress || !progress.is_unlocked) {
      return c.json({ error: "Task is locked" }, 403);
    }

    const questions = await kv.get(`questions:${taskId}`);
    if (!questions) {
      return c.json({ error: "Quiz not found" }, 404);
    }

    const safeQuestions = questions.map(({ correct_answer, ...q }) => q);

    return c.json({ questions: safeQuestions });
  } catch (error) {
    console.error("Error fetching quiz:", error);
    return c.json({ error: "Failed to fetch quiz", details: error.message }, 500);
  }
});

// Submit quiz
app.post("/make-server-9bf00556/task/:taskId/submit", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    const token = authHeader?.split(" ")[1];
    
    if (!token) {
      return c.json({ error: "Authorization token required" }, 401);
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return c.json({ error: "Invalid or expired token" }, 401);
    }

    const taskId = c.req.param("taskId");
    const userId = decoded.userId;
    const body = await c.req.json();
    const { answers } = body;

    const progress = await kv.get(`progress:${userId}:${taskId}`);
    if (!progress || !progress.is_unlocked) {
      return c.json({ error: "Task is locked" }, 403);
    }

    const task = await kv.get(`task:${taskId}`);
    const questions = await kv.get(`questions:${taskId}`);

    if (!task || !questions) {
      return c.json({ error: "Task or quiz not found" }, 404);
    }

    // Grade quiz
    let correctCount = 0;
    const results = questions.map(q => {
      const userAnswer = answers[q.id];
      const isCorrect = userAnswer === q.correct_answer;
      if (isCorrect) correctCount++;
      
      return {
        questionId: q.id,
        correct: isCorrect,
        correctAnswer: q.correct_answer,
        userAnswer
      };
    });

    const score = Math.round((correctCount / questions.length) * 100);
    const passed = score >= task.passing_score;

    // Update progress
    const updatedProgress = {
      ...progress,
      is_passed: passed || progress.is_passed,
      highest_score: Math.max(score, progress.highest_score ?? 0)
    };
    await kv.set(`progress:${userId}:${taskId}`, updatedProgress);

    // Unlock next task
    if (passed) {
      const allTasks = await kv.getByPrefix("task:");
      const nextTask = allTasks.find(t => t.sequence_order === task.sequence_order + 1);
      
      if (nextTask) {
        const nextProgress = await kv.get(`progress:${userId}:${nextTask.id}`);
        if (nextProgress) {
          await kv.set(`progress:${userId}:${nextTask.id}`, {
            ...nextProgress,
            is_unlocked: true
          });
        }
      }
    }

    return c.json({
      score,
      passed,
      correctCount,
      totalQuestions: questions.length,
      passingScore: task.passing_score,
      results,
      nextTaskUnlocked: passed
    });
  } catch (error) {
    console.error("Error submitting quiz:", error);
    return c.json({ error: "Failed to submit quiz", details: error.message }, 500);
  }
});

Deno.serve(app.fetch);