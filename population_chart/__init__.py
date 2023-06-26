import os
import streamlit.components.v1 as components

# Set the absolute path to the "frontend" directory
frontendDir = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "frontend")
)

populationChart = components.declare_component(
    name="populationChart",  # Name of the component
    path=str(frontendDir)  # Path to the component's JavaScript implementation
)
