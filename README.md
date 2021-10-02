# Barcelona, a city of Data

This repository is the result of a project for the COM-480 Data Visualization EPFL course.

Our goal was to provide on a single page, all the important data about barcelona districts from [kaggle barcelona data sets](https://www.kaggle.com/xvivancos/barcelona-data-sets), through precisely selected visualizations. We therefore chose to put an interactive map in the background and the interactive visualizations around it. Note that the visualization experienced is best on a 16/9 monitor (sorry phone users) because of scaling issues, as it is often the case in dashboard-type websites.

## See it for yourself !

Click on the picture below to access the website

[![Click to go to the website](https://user-images.githubusercontent.com/32189761/135726477-727c1c5b-6898-4f9f-b1ff-670623e02268.png)](https://com-480-data-visualization.github.io/data-visualization-project-2021-zozo/)


## Running it yourself

To setup our project you can simply clone the master branch and run the following command inside the cloned directory (requires python3) : 

``` python3 -m http.server ```. This will launch a local server hosting the website. Then you will be able to access our website by opening your browser with the following URL : ``` https://0.0.0.0:8000/ ```

## All features 

[Screencast](https://www.youtube.com/watch?v=qaJPogi9B5A)

In the following section we will list the possible interactions with our webstie :


 * Selecting a district : You can click on a district and see all the data corresponding to it on the right, through the dynamic bar plots. Additionally we display more information about the district in a table at the botton.
 
 
 * Comparing two districts : By clicking on a second district you can compare them. The plots on the right will then adapt to this and show the data of both districts at the same time. The bottom table will then also show both district values and highlight the bigger of the two. The spider web graph will then also show the difference between the two in a more compact way.
 
 * Choropleth map : It is possible to see the evolution of many features, like the population or even the birth rate from 2014 to 2017 through the choropleth map. This gives a easy way of getting a global overview of how each district does compared to the other ones. On the top left there is a legend that is updated each time the user interacts with the selectors on the bottom left. Those selectors allow you to change the date and the attribute (like the death rate for example).
 
## Reports relevant to the project

[Milestone 1](milestones/milestone1/Milestone1.pdf) • [Milestone 2](milestones/milestone2/Milestone2.pdf) • [Milestone 3](milestones/processbook.pdf)

[Process book](milestones/processbook.pdf)

## Acknowledgments

We enjoyed a lot working on this project and acquired much knowledge about data visualization and web development. Thanks to all the teaching team for their help :)


Viva Barcelona !

---
### Authors

- Louis Perrier
- Marc Egli 
- Léopaul Boesinger 
