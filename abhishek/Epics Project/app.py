import json
from flask import Flask, request, render_template
import pandas as pd
import numpy as np
import neattext.functions as nfx
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from dashboard import getvaluecounts, getlevelcount, getsubjectsperlevel, yearwiseprofit

app = Flask(__name__)

# Function to load data
def readdata():
    df = pd.read_csv('UdemyCleanedTitle.csv')
    return df

# Function to preprocess course titles
def getcleantitle(df):
    df['Clean_title'] = df['course_title'].apply(nfx.remove_stopwords)
    df['Clean_title'] = df['Clean_title'].apply(nfx.remove_special_characters)
    return df

# Function to compute cosine similarity matrix
def getcosinemat(df):
    countvect = CountVectorizer()
    cvmat = countvect.fit_transform(df['Clean_title'])
    return cvmat

def cosinesimmat(cv_mat):
    return cosine_similarity(cv_mat)

# Function to recommend courses
def recommend_course(df, title, cosine_mat, numrec):
    if title not in df['course_title'].values:
        return pd.DataFrame()  # Return empty DataFrame if course not found

    course_index = pd.Series(df.index, index=df['course_title']).drop_duplicates()
    index = course_index[title]
    scores = list(enumerate(cosine_mat[index]))
    sorted_scores = sorted(scores, key=lambda x: x[1], reverse=True)

    selected_course_index = [i[0] for i in sorted_scores[1:numrec+1]]
    selected_course_score = [i[1] for i in sorted_scores[1:numrec+1]]

    rec_df = df.iloc[selected_course_index].copy()  # Ensure a copy to avoid SettingWithCopyWarning
    rec_df['Similarity_Score'] = selected_course_score

    return rec_df[['course_title', 'Similarity_Score', 'url', 'price', 'num_subscribers']]

# Function to search for courses by partial title
def searchterm(term, df):
    result_df = df[df['course_title'].str.contains(term, case=False, na=False)]
    return result_df.sort_values(by='num_subscribers', ascending=False).head(6)

# Function to extract course features
def extractfeatures(recdf):
    return list(recdf['url']), list(recdf['course_title']), list(recdf['price'])

# Route for homepage and recommendations
@app.route('/', methods=['GET', 'POST'])
def home():
    # Manually set the available courses
    available_courses = [
        'HTML',
        'Python',
        'Java',
        'Data Structures and Algorithms',
        'JavaScript',
        'C++'
    ]

    df = readdata()
    df = getcleantitle(df)
    cvmat = getcosinemat(df)
    cosine_mat = cosinesimmat(cvmat)
    num_rec = 6

    if request.method == 'POST':
        titlename = request.form.get('course', '').strip()
        print("User selected:", titlename)

        recdf = recommend_course(df, titlename, cosine_mat, num_rec)

        if not recdf.empty:
            course_url, course_title, course_price = extractfeatures(recdf)
            dictmap = dict(zip(course_title, course_url))
            return render_template('index.html', available_courses=available_courses, coursemap=dictmap, coursename=titlename, showtitle=True)
        else:
            resultdf = searchterm(titlename, df)
            if not resultdf.empty:
                course_url, course_title, course_price = extractfeatures(resultdf)
                coursemap = dict(zip(course_title, course_url))
                return render_template('index.html', available_courses=available_courses, coursemap=coursemap, coursename=titlename, showtitle=True)
            else:
                return render_template('index.html', available_courses=available_courses, showerror=True, coursename=titlename)

    return render_template('index.html', available_courses=available_courses)

# Route for dashboard
@app.route('/dashboard', methods=['GET', 'POST'])
def dashboard():
    df = readdata()

    valuecounts = getvaluecounts(df)
    levelcounts = getlevelcount(df)
    subjectsperlevel = getsubjectsperlevel(df)
    yearwiseprofitmap, subscriberscountmap, profitmonthwise, monthwisesub = yearwiseprofit(df)

    return render_template(
        'dashboard.html',
        valuecounts=json.dumps(valuecounts),
        levelcounts=json.dumps(levelcounts),
        subjectsperlevel=json.dumps(subjectsperlevel),
        yearwiseprofitmap=json.dumps(yearwiseprofitmap),
        subscriberscountmap=json.dumps(subscriberscountmap),
        profitmonthwise=json.dumps(profitmonthwise),
        monthwisesub=json.dumps(monthwisesub)
    )

if __name__ == '__main__':
    app.run(debug=True, port=8080)
