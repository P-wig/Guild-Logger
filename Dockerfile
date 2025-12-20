# Use an official Python runtime as a parent image
FROM python:3.10

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container
COPY . .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Create a non-root user and switch to it
RUN useradd --create-home appuser
USER appuser

# Expose the port that the app runs on
EXPOSE 5000

# Command to run the Flask app
CMD ["python", "runserver.py"]