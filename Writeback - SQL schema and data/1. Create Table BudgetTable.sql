USE [WritebackTest]
GO

ALTER TABLE [dbo].[BudgetTable] DROP CONSTRAINT [DF_BudgetTable_CreationDate]
GO

/****** Object:  Table [dbo].[BudgetTable]    Script Date: 8/30/2014 2:28:24 PM ******/
DROP TABLE [dbo].[BudgetTable]
GO

/****** Object:  Table [dbo].[BudgetTable]    Script Date: 8/30/2014 2:28:24 PM ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[BudgetTable](
	[BudgetId] [int] IDENTITY(1,1) NOT NULL,
	PeriodNo int NOT NULL,
	[CreationDate] [datetime] NOT NULL,
	[BudgetAmount] [money] NULL,
	[ForecastAmount] [money] NULL,
	[ActualAmount] [money] NULL
) ON [PRIMARY]

GO

ALTER TABLE [dbo].[BudgetTable] ADD  CONSTRAINT [DF_BudgetTable_CreationDate]  DEFAULT (getdate()) FOR [CreationDate]
GO


