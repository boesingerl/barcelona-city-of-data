import pandas as pd


df = pd.read_csv('unemployment.csv').groupby(['Year','Month','District.Name']).sum().reset_index()


df = df[df['Month'] == 'January']
df = df[df['District.Name']  != 'No consta']

df.drop(['District.Code','Month','Neighborhood.Code'], axis=1).to_csv('unemployment_year.csv')
