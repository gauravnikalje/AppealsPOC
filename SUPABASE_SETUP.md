# Supabase Setup Guide for CKD Appeals AI

This guide will help you set up Supabase as the database for your CKD Appeals AI application.

## 🚀 Quick Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `ckd-appeals-ai`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"

### 2. Get Database Connection Details

Once your project is created:

1. Go to **Settings** → **Database**
2. Scroll down to **Connection string**
3. Copy the **URI** connection string
4. Replace `[YOUR-PASSWORD]` with your database password

### 3. Set Environment Variables

#### For Local Development:
Create a `.env` file in the project root:

```bash
# Google AI API Key
GOOGLE_API_KEY=your_google_api_key_here

# Supabase Database URL (recommended)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres

# Server Configuration
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

#### For Vercel Deployment:
Add these environment variables in your Vercel project settings:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:
   - `GOOGLE_API_KEY`: Your Google AI API key
   - `DATABASE_URL`: Your Supabase database URL
   - `NODE_ENV`: `production`
   - `CORS_ORIGIN`: Your frontend URL

### 4. Database Schema

The application will automatically create the required tables when it starts. The main table is:

```sql
CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. Install Dependencies

```bash
npm install
```

### 6. Test the Connection

Start the server:

```bash
npm start
```

You should see:
```
Database connection established successfully.
Database synced successfully. Tasks table created/updated.
Sequelize (PostgreSQL/Supabase) initialized
```

## 🔧 Alternative Configuration

If you prefer to use Supabase URL and Key instead of the direct database URL:

```bash
# Instead of DATABASE_URL, use:
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## 🛡️ Security Considerations

1. **Never commit your `.env` file** to version control
2. **Use strong database passwords**
3. **Enable Row Level Security (RLS)** in Supabase if needed
4. **Regularly rotate your API keys**

## 🔍 Troubleshooting

### Common Issues:

1. **Connection Failed**: Check your DATABASE_URL format
2. **SSL Error**: The connection includes SSL configuration
3. **Permission Denied**: Ensure your database password is correct
4. **Table Not Found**: The app will create tables automatically on first run

### Debug Steps:

1. Check environment variables are set correctly
2. Verify Supabase project is active
3. Test connection with a simple query
4. Check Vercel logs for detailed error messages

## 📊 Monitoring

Monitor your database usage in the Supabase dashboard:
- **Database** → **Logs**: View query logs
- **Database** → **Usage**: Monitor resource usage
- **Database** → **Backups**: Automatic daily backups

## 🚀 Deployment Checklist

- [ ] Supabase project created
- [ ] Environment variables set in Vercel
- [ ] Database connection tested
- [ ] Tables created automatically
- [ ] Application deployed successfully
- [ ] Integration tests passing

---

**Need Help?** Check the Supabase documentation or create an issue in the project repository.
