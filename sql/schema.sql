-- Create enum for activity types
CREATE TYPE activity_type AS ENUM ('meditation', 'journal');

-- Create table for tracking user activities
CREATE TABLE user_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type activity_type NOT NULL,
    activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Add a unique constraint to prevent duplicate activities of the same type on the same day
    UNIQUE(user_id, activity_type, activity_date)
);

-- Create view for calculating streaks
CREATE OR REPLACE VIEW user_streaks AS
WITH daily_activities AS (
    -- Get the most recent activity dates for each user
    SELECT DISTINCT
        user_id,
        activity_date
    FROM user_activities
    GROUP BY user_id, activity_date
),
streak_groups AS (
    -- Calculate streak groups
    SELECT 
        user_id,
        activity_date,
        activity_date - (ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY activity_date))::INTEGER AS streak_group
    FROM daily_activities
),
streak_lengths AS (
    -- Calculate streak lengths
    SELECT 
        user_id,
        streak_group,
        COUNT(*) as streak_length,
        MIN(activity_date) as streak_start,
        MAX(activity_date) as streak_end
    FROM streak_groups
    GROUP BY user_id, streak_group
)
SELECT 
    user_id,
    streak_length,
    streak_start,
    streak_end,
    CASE 
        WHEN streak_end = CURRENT_DATE THEN true
        ELSE false
    END as is_current_streak
FROM streak_lengths;

-- Enable Row Level Security (RLS)
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view only their own activities
CREATE POLICY "Users can view their own activities"
    ON user_activities
    FOR SELECT
    USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own activities
CREATE POLICY "Users can insert their own activities"
    ON user_activities
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update only their journal entries
CREATE POLICY "Users can update their own journal entries"
    ON user_activities
    FOR UPDATE
    USING (
        auth.uid() = user_id 
        AND activity_type = 'journal'
    );

-- Create policy to allow users to delete only their journal entries
CREATE POLICY "Users can delete their own journal entries"
    ON user_activities
    FOR DELETE
    USING (
        auth.uid() = user_id 
        AND activity_type = 'journal'
    );

-- Create function to get user's current streak
CREATE OR REPLACE FUNCTION get_current_streak(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    streak INTEGER;
BEGIN
    SELECT streak_length
    INTO streak
    FROM user_streaks
    WHERE user_id = user_uuid
    AND is_current_streak = true
    LIMIT 1;
    
    RETURN COALESCE(streak, 0);
END;
$$ LANGUAGE plpgsql;

-- Add foreign key to journal_entries table to reference user_activities
ALTER TABLE journal_entries 
ADD CONSTRAINT fk_activity 
FOREIGN KEY (id) 
REFERENCES user_activities(id)
ON DELETE CASCADE; 