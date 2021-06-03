# Project of Data Visualization (COM-480)

| Student's name | SCIPER |
| -------------- | ------ |
| Louis Perrier | 273058 |
| Marc Egli | 283231 |
| Léopaul Boesinger | 288715 |

[Milestone 1](milestones/milestone1/Milestone1.pdf) • [Milestone 2](milestones/milestone2/Milestone2.pdf) • [Milestone 3](#milestone-3)


[Process book](processbook.pdf)

[Screencast](link)


## Technical Setup

To setup our project you can simply clone the master branch and run the following command inside the cloned directory : ``` python3 -m http.server ```. This will launch a local server hosting the website. Then you will be able to access our website by opening your browser with the following URL : ``` https://0.0.0.0:8000/ ```

You can also directly access the website, without cloning the repository, by following this link : ```  https://com-480-data-visualization.github.io/data-visualization-project-2021-zozo/ ```


## Intended usage

The goal was to provide on a single page all the important data through precisly selected visualizations. Therefore we choose to put the interactive map in the background and the interactive visualizations around it. Note that the visualization is experienced at best on a 1080p monitor because of scaling issues and that the zoom of your browser should be at 100%.

In the following section we will list the possible interactions with our webstie :


 * Selecting a district : You can click on a district and see all the data corresponding to it on the right through changing bar plots. Additionaly we show more information oabout the district in a table at the botton.
 
 
 * Comparing two districts : By clicking on a second district you can compare them. The plots and the right will then adapt to this and show the data of both districts at the same time. The bottom table will then also show both district values and highlight the bigger from the two. The spider web graph will then also show the difference of the two in another way.
 
 * Choropleth map : It is possible to see the evolution of the population or even the birth rate form 2014 to 2017 through the choropleth map. This gives a easy way of getting a global overview of how each district does compared to the other ones. On the top left there is a legend that is updated each time the user interacts with the selectors on the bottom left where it is possible to chnge the date and the attribute, death rate for example.
 
## Acknowledgment

We enjoyed a lot working on this project and acquired many helpful knowledges about data visualization and web development. Thanks to all the teaching team for their help :)


Viva Barcelona !
