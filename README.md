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

The goal was to provide on a single page all the important data about barcelona through precisely selected visualizations. Therefore we chose to put an interactive map in the background and the interactive visualizations around it. Note that the visualization is experienced at best on a 1080p monitor because of scaling issues and that the zoom of your browser should be at 100%.

In the following section we will list the possible interactions with our webstie :


 * Selecting a district : You can click on a district and see all the data corresponding to it on the right, through the dynamic bar plots. Additionally we display more information about the district in a table at the botton.
 
 
 * Comparing two districts : By clicking on a second district you can compare them. The plots on the right will then adapt to this and show the data of both districts at the same time. The bottom table will then also show both district values and highlight the bigger of the two. The spider web graph will then also show the difference between the two in a more compact way.
 
 * Choropleth map : It is possible to see the evolution of many features, like the population or even the birth rate from 2014 to 2017 through the choropleth map. This gives a easy way of getting a global overview of how each district does compared to the other ones. On the top left there is a legend that is updated each time the user interacts with the selectors on the bottom left. Those selectors allow you to change the date and the attribute (like the death rate for example).
 
## Acknowledgment

We enjoyed a lot working on this project and acquired much knowledge about data visualization and web development. Thanks to all the teaching team for their help :)


Viva Barcelona !
